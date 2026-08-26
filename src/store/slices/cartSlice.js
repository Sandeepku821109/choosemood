import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import axios from 'axios'
import { backendUrl } from '../../config'

// Helper function to get user ID
const getUserId = () => {
  return localStorage.getItem('userId')
}

// Auth is handled by httpOnly cookie (withCredentials=true on all axios requests).
// We keep a minimal header helper only for endpoints that explicitly need it.
const getHeaders = () => ({
  'Content-Type': 'application/json'
})

// Centralized image processing function
const processProductImage = (item, productData = null) => {
  const product = productData || item.product || item

  // Handle image with multiple fallbacks
  let image = item.productImage || 
             item.image || 
             product.image || 
             product.productImage ||
             product.images

  // If image is an array, get the first item
  if (Array.isArray(image) && image.length > 0) {
    image = image[0]
  }

  // If image is still an array of arrays, get the first item of the first array
  if (Array.isArray(image) && Array.isArray(image[0])) {
    image = image[0][0]
  }

  // Add backend URL if needed (for relative paths)
  if (image && 
      typeof image === 'string' && 
      !image.startsWith('http') && 
      !image.startsWith('data:') && 
      !image.includes('placeholder') &&
      !image.includes('unsplash')) {
    
    // Remove leading slash to avoid double slashes
    if (image.startsWith('/')) {
      image = image.substring(1)
    }
    image = `${backendUrl}/${image}`
  }

  // Fallback to placeholder if no valid image
  if (!image || typeof image !== 'string') {
    image =
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#f3f4f6"/><text x="150" y="155" font-family="sans-serif" font-size="20" fill="#9ca3af" text-anchor="middle">No Image</text></svg>`
      )
  }

  return image
}

// Centralized cart item processing function
const processCartItem = (item) => {
  if (!item) return null
  
  // Get the product data - it might be nested or direct
  const productData = item.product || item
  
  return {
    itemId: item._id || item.itemId || item.id,
    productId: item.productId || productData._id || productData.id,
    name: item.name || productData.name || 'Unknown Product',
    image: processProductImage(item, productData),
    selectedSize: item.selectedSize || item.size,
    selectedColor: item.selectedColor || item.color,
    quantity: Number(item.quantity || 1),
    price: Number(item.price || productData.price || 0),
    discount: Number(item.discount || productData.discount || 0),
    description: item.description || productData.description,
    category: item.category || productData.category
  }
}

// Async thunks for cart operations
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/cart`, {
        headers: getHeaders(),
        timeout: 10000
      })

      console.log('🛒 Raw cart response:', response.data);

      // Handle different response structures and get the items array
      let cartItems = []
      if (response.data?.data?.items) {
        cartItems = response.data.data.items
      } else if (response.data?.cart?.items) {
        cartItems = response.data.cart.items
      } else if (response.data?.items) {
        cartItems = response.data.items
      } else if (Array.isArray(response.data)) {
        cartItems = response.data
      }

      // Process each cart item using the centralized function
      const processedItems = cartItems.map(processCartItem).filter(Boolean)

      console.log('✅ Processed cart items:', processedItems);
      return processedItems

    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication failed. Please log in again.')
      }
      if (error.response?.status === 403) {
        return rejectWithValue('Access denied. Please check your permissions.')
      }
      if (error.code === 'ECONNABORTED') {
        return rejectWithValue('Request timeout. Please try again.')
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch cart')
    }
  }
)

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (cartItemData, { rejectWithValue, dispatch }) => {
    try {
      // normalize payload expected by backend
      const payload = {
        productId: cartItemData?.productId || cartItemData?.product || cartItemData?.product_id || cartItemData?.id,
        size: cartItemData?.size ?? cartItemData?.selectedSize ?? null,
        quantity: Number(cartItemData?.quantity ?? 1),
        ...(cartItemData?.price && { price: cartItemData.price }),
        ...(cartItemData?.name && { name: cartItemData.name }),
        ...(cartItemData?.color && { color: cartItemData.color })
      }

      if (!payload.productId) {
        return rejectWithValue('productId is required to add to cart')
      }

      const response = await axios.post(`${backendUrl}/api/cart/add`, payload, {
        headers: getHeaders()
      })

      // Re-fetch cart to ensure data consistency after adding an item
      dispatch(fetchCart())
      
      // return normalized cart item if backend returns it, otherwise response.data
      return response.data?.item || response.data?.cartItem || response.data
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400 || error.response.status === 401) {
          return rejectWithValue(error.response.data.message || 'An error occurred.')
        }
      }
      return rejectWithValue(error.message || 'Failed to add item to cart. Please try again.')
    }
  }
)

export const updateCartQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async ({ itemId, productId, quantity }, { rejectWithValue, dispatch }) => {
    try {
      const userId = getUserId()
      const updateId = itemId || productId
      
      const updateData = {
        userId: userId,
        itemId: updateId,
        quantity: quantity
      }

      const response = await axios.put(`${backendUrl}/api/cart/update/${updateId}`, updateData, {
        headers: getHeaders()
      })

      // Re-fetch cart to ensure data consistency
      dispatch(fetchCart())

      return { itemId: updateId, productId, quantity }
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication failed. Please log in again.')
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update quantity')
    }
  }
)

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ itemId, productId }, { rejectWithValue, dispatch }) => {
    try {
      const userId = getUserId()
      const removeId = itemId || productId

      if (!removeId) {
        return rejectWithValue('No item ID or product ID provided for removal')
      }

      const response = await axios.delete(`${backendUrl}/api/cart/remove/${removeId}`, {
        headers: getHeaders(),
        data: { 
          userId: userId, 
          itemId: removeId 
        }
      })

      // Re-fetch cart to ensure data consistency
      dispatch(fetchCart())

      return { 
        itemId: itemId || removeId, 
        productId: productId || removeId,
        removedId: removeId
      }
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication failed. Please log in again.')
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to remove item from cart')
    }
  }
)

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${backendUrl}/api/cart/clear`, {
        headers: getHeaders()
      })

      return response.data
    } catch (error) {
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication failed. Please log in again.')
      }
      
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to clear cart')
    }
  }
)

const SHIPPING_RATE = 49 // ₹49 shipping
const FREE_SHIPPING_THRESHOLD = 999 // Free shipping above ₹999

const initialState = {
  items: [],
  selectedItems: [], // array of itemIds that are checked for checkout
  loading: false,
  error: null,
  updating: {},
  totalItems: 0,
  subtotal: 0,
  shipping: 0,
  total: 0,
  lastFetch: null
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUpdating: (state, action) => {
      const { productId, isUpdating } = action.payload
      state.updating[productId] = isUpdating
    },
    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)
      state.subtotal = state.items.reduce((sum, item) => {
        const itemPrice = item.discount > 0 
          ? item.price - (item.price * item.discount / 100)
          : item.price
        return sum + (itemPrice * item.quantity)
      }, 0)
      state.shipping = state.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE
      state.total = state.subtotal + state.shipping
    },

    // --- Selection reducers (cart checkboxes) ---
    toggleItemSelection: (state, action) => {
      const itemId = action.payload
      const idx = state.selectedItems.indexOf(itemId)
      if (idx >= 0) {
        state.selectedItems.splice(idx, 1)
      } else {
        state.selectedItems.push(itemId)
      }
    },
    selectAllItems: (state) => {
      state.selectedItems = state.items.map(item => item.itemId || item.productId || item.id)
    },
    deselectAllItems: (state) => {
      state.selectedItems = []
    },
    // Add local cart management for non-authenticated users
    addToLocalCart: (state, action) => {
      const newItem = action.payload
      
      const processedItem = {
        ...processCartItem(newItem),
        itemId: newItem.itemId || `local_${Date.now()}_${Math.random()}`,
        quantity: newItem.quantity || 1
      }
      
      const existingItemIndex = state.items.findIndex(
        item => item.productId === processedItem.productId && 
                item.selectedSize === processedItem.selectedSize && 
                item.selectedColor === processedItem.selectedColor
      )
      
      if (existingItemIndex >= 0) {
        state.items[existingItemIndex].quantity += processedItem.quantity
      } else {
        state.items.push(processedItem)
      }
      
      cartSlice.caseReducers.calculateTotals(state)
      localStorage.setItem('localCart', JSON.stringify(state.items))
    },
    removeFromLocalCart: (state, action) => {
      const itemId = action.payload
      state.items = state.items.filter(item => item.itemId !== itemId)
      cartSlice.caseReducers.calculateTotals(state)
      localStorage.setItem('localCart', JSON.stringify(state.items))
    },
    updateLocalCartQuantity: (state, action) => {
      const { itemId, quantity } = action.payload
      const itemIndex = state.items.findIndex(item => item.itemId === itemId)
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1)
        } else {
          state.items[itemIndex].quantity = quantity
        }
      }
      
      cartSlice.caseReducers.calculateTotals(state)
      localStorage.setItem('localCart', JSON.stringify(state.items))
    },
    loadLocalCart: (state) => {
      const localCart = localStorage.getItem('localCart')
      if (localCart) {
        try {
          state.items = JSON.parse(localCart)
          cartSlice.caseReducers.calculateTotals(state)
        } catch (error) {
          console.error('Error loading local cart:', error)
          localStorage.removeItem('localCart')
        }
      }
    },
    clearLocalCart: (state) => {
      state.items = []
      state.selectedItems = []
      state.updating = {}
      cartSlice.caseReducers.calculateTotals(state)
      localStorage.removeItem('localCart')
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.selectedItems = action.payload.map(item => item.itemId || item.productId || item.id)
        state.lastFetch = Date.now()
        cartSlice.caseReducers.calculateTotals(state)
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addToCart.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update Cart Item Quantity
      .addCase(updateCartQuantity.pending, (state, action) => {
        const { itemId, productId } = action.meta.arg
        const id = itemId || productId
        state.updating[id] = true
        state.error = null
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        const { itemId, productId, quantity } = action.payload
        const id = itemId || productId
        state.updating[id] = false
        
        const itemIndex = state.items.findIndex(item => item.itemId === itemId || item.productId === productId)
        if (itemIndex !== -1) {
          state.items[itemIndex].quantity = quantity
        }
        cartSlice.caseReducers.calculateTotals(state)
      })
      .addCase(updateCartQuantity.rejected, (state, action) => {
        const { itemId, productId } = action.meta.arg
        const id = itemId || productId
        state.updating[id] = false
        state.error = action.payload
      })
      
      // Remove from Cart
      .addCase(removeFromCart.pending, (state, action) => {
        const { itemId, productId } = action.meta.arg
        const id = itemId || productId
        state.updating[id] = true
        state.error = null
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const { itemId, productId, removedId } = action.payload
        const id = removedId || itemId || productId
        state.updating[id] = false
        
        // Filter out the item using the removedId or fallback to itemId/productId
        state.items = state.items.filter(item => {
          return !(
            item.itemId === removedId ||
            item.id === removedId ||
            item.productId === removedId ||
            (itemId && (item.itemId === itemId || item.id === itemId)) ||
            (productId && (item.productId === productId || item.id === productId))
          )
        })

        // Remove from selectedItems if it was selected
        state.selectedItems = state.selectedItems.filter(sid => sid !== id && sid !== itemId && sid !== productId)
        
        cartSlice.caseReducers.calculateTotals(state)
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        const { itemId, productId } = action.meta.arg
        const id = itemId || productId
        state.updating[id] = false
        state.error = action.payload
      })
      
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false
        state.items = []
        state.selectedItems = []
        state.updating = {}
        cartSlice.caseReducers.calculateTotals(state)
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError, setUpdating, calculateTotals, toggleItemSelection, selectAllItems, deselectAllItems, addToLocalCart, removeFromLocalCart, updateLocalCartQuantity, loadLocalCart, clearLocalCart } = cartSlice.actions

// Add these memoized selectors after the cartSlice definition
export const selectCartItems = (state) => state.cart.items
export const selectCartLoading = (state) => state.cart.loading
export const selectCartError = (state) => state.cart.error
export const selectCartUpdating = (state) => state.cart.updating
export const selectCartTotals = (state) => ({
  totalItems: state.cart.totalItems,
  subtotal: state.cart.subtotal,
  shipping: state.cart.shipping,
  total: state.cart.total
})

// Memoized selectors for better performance
export const selectCartItemsCount = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => sum + item.quantity, 0)
)

// Selection-related selectors
export const selectSelectedItems = (state) => state.cart.selectedItems

export const selectSelectedCartItems = createSelector(
  [selectCartItems, selectSelectedItems],
  (items, selected) => items.filter(item => selected.includes(item.itemId || item.productId || item.id))
)

export const selectSelectedCount = createSelector(
  [selectSelectedItems],
  (selected) => selected.length
)

export const selectSelectedSubtotal = createSelector(
  [selectSelectedCartItems],
  (items) => items.reduce((sum, item) => {
    const itemPrice = item.discount > 0 
      ? item.price - (item.price * item.discount / 100)
      : item.price
    return sum + (itemPrice * item.quantity)
  }, 0)
)

export const selectSelectedTotal = createSelector(
  [selectSelectedSubtotal],
  (subtotal) => {
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE
    return subtotal + shipping
  }
)

export const selectCartSubtotal = createSelector(
  [selectCartItems],
  (items) => items.reduce((sum, item) => {
    const itemPrice = item.discount > 0 
      ? item.price - (item.price * item.discount / 100)
      : item.price
    return sum + (itemPrice * item.quantity)
  }, 0)
)

export const selectCartTotal = createSelector(
  [selectCartSubtotal],
  (subtotal) => {
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE
    return subtotal + shipping
  }
)

export const selectCartItemById = createSelector(
  [selectCartItems, (state, itemId) => itemId],
  (items, itemId) => items.find(item => item.itemId === itemId || item.productId === itemId)
)

export const selectIsItemInCart = createSelector(
  [selectCartItems, (state, productId) => productId],
  (items, productId) => items.some(item => item.productId === productId)
)

export const selectCartItemsGroupedByCategory = createSelector(
  [selectCartItems],
  (items) => {
    return items.reduce((groups, item) => {
      const category = item.category || 'Other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
      return groups
    }, {})
  }
)

// Performance optimized cart state selector
export const selectCartState = createSelector(
  [selectCartItems, selectCartLoading, selectCartError, selectCartTotals],
  (items, loading, error, totals) => ({
    items,
    loading,
    error,
    ...totals,
    isEmpty: items.length === 0,
    hasItems: items.length > 0
  })
)

// Legacy localStorage implementation
const cartSliceLegacy = createSlice({
  name: 'cart',
  initialState: {
    cartItems: localStorage.getItem('cartItems') 
      ? JSON.parse(localStorage.getItem('cartItems')) 
      : [],
    totalAmount: localStorage.getItem('totalAmount') 
      ? parseFloat(localStorage.getItem('totalAmount')) 
      : 0,
    totalQuantity: localStorage.getItem('totalQuantity') 
      ? parseInt(localStorage.getItem('totalQuantity')) 
      : 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload
      const existingItem = state.cartItems.find(item => item.id === newItem.id)
      
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        state.cartItems.push({ ...newItem, quantity: 1 })
      }
      
      state.totalQuantity += 1
      state.totalAmount += newItem.price
      
      localStorage.setItem('cartItems', JSON.stringify(state.cartItems))
      localStorage.setItem('totalAmount', state.totalAmount.toString())
      localStorage.setItem('totalQuantity', state.totalQuantity.toString())
    },
    
    removeFromCart: (state, action) => {
      const id = action.payload
      const existingItem = state.cartItems.find(item => item.id === id)
      
      if (existingItem) {
        state.totalQuantity -= existingItem.quantity
        state.totalAmount -= (existingItem.price * existingItem.quantity)
        state.cartItems = state.cartItems.filter(item => item.id !== id)
        
        localStorage.setItem('cartItems', JSON.stringify(state.cartItems))
        localStorage.setItem('totalAmount', state.totalAmount.toString())
        localStorage.setItem('totalQuantity', state.totalQuantity.toString())
      }
    },
    
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.cartItems.find(item => item.id === id)
      
      if (item) {
        const quantityDifference = quantity - item.quantity
        state.totalQuantity += quantityDifference
        state.totalAmount += (item.price * quantityDifference)
        item.quantity = quantity
        
        localStorage.setItem('cartItems', JSON.stringify(state.cartItems))
        localStorage.setItem('totalAmount', state.totalAmount.toString())
        localStorage.setItem('totalQuantity', state.totalQuantity.toString())
      }
    },
    
    clearCart: (state) => {
      state.cartItems = []
      state.totalAmount = 0
      state.totalQuantity = 0
      
      localStorage.setItem('cartItems', JSON.stringify(state.cartItems))
      localStorage.setItem('totalAmount', state.totalAmount.toString())
      localStorage.setItem('totalQuantity', state.totalQuantity.toString())
    }
  }
})

export const { addToCart: addToCartLegacy, removeFromCart: removeFromCartLegacy, updateQuantity: updateQuantityLegacy, clearCart: clearCartLegacy } = cartSliceLegacy.actions
export default cartSlice.reducer
