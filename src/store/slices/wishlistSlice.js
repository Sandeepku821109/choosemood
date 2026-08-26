import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import axios from 'axios'
import { processImageUrl } from '../../utils/imageUtils'

import config from '../../config'

const backendUrl = config.backendUrl

// normalize presence flags in localStorage so other modules can check booleans reliably
const normalizeLocalStorageFlags = () => {
  try {
    if (localStorage.getItem('authToken')) localStorage.setItem('hasAuthToken', 'true')
    if (localStorage.getItem('token')) localStorage.setItem('hasToken', 'true')
    if (localStorage.getItem('userId') || localStorage.getItem('userEmail')) localStorage.setItem('isLoggedIn', 'true')
    if (localStorage.getItem('razorpayid') || localStorage.getItem('razorpayOrderId') || localStorage.getItem('razorpay_order_id')) {
      localStorage.setItem('hasRazorpayId', 'true')
    }
  } catch (e) {
    // non-blocking
    console.debug('normalizeLocalStorageFlags error', e)
  }
}

const getLocalBoolean = (key) => {
  try {
    return String(localStorage.getItem(key)).toLowerCase() === 'true'
  } catch (e) {
    return false
  }
}

// ensure flags exist at module load
normalizeLocalStorageFlags()

// Auth is handled by httpOnly cookie (withCredentials=true on all axios requests).
const getHeaders = () => ({ 'Content-Type': 'application/json' })

// Robust image resolver
const NO_IMAGE_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#f3f4f6"/><text x="150" y="155" font-family="sans-serif" font-size="20" fill="#9ca3af" text-anchor="middle">No Image</text></svg>`
  )

const processImageUrlInSlice = (product) => {
  if (!product) return NO_IMAGE_FALLBACK
  let imageSource = product.image
  if (!imageSource && Array.isArray(product.images) && product.images.length > 0) imageSource = product.images[0]
  if (!imageSource && product.productImage) imageSource = product.productImage
  if (Array.isArray(imageSource) && imageSource.length > 0) imageSource = imageSource[0]
  if (!imageSource || typeof imageSource !== 'string') return NO_IMAGE_FALLBACK
  let finalImage = imageSource
  if (
    finalImage &&
    typeof finalImage === 'string' &&
    !finalImage.startsWith('http') &&
    !finalImage.startsWith('data:') &&
    !finalImage.includes('placeholder') &&
    !finalImage.includes('unsplash')
  ) {
    if (finalImage.startsWith('/')) finalImage = finalImage.substring(1)
    finalImage = `${backendUrl}/${finalImage}`
  }
  return finalImage
}

// Async thunks
export const fetchWishlistItems = createAsyncThunk(
  'wishlist/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      const headers = getHeaders()
      const response = await axios.get(`${backendUrl}/api/wishlist`, { headers })
      const items = response.data.data?.items || response.data.items || response.data.data || response.data || []
      return items.map(item => ({
        id: item._id || item.id || item.productId,
        productId: item.productId || item._id || item.id,
        name: item.name || 'Product',
        price: parseFloat(item.price) || 0,
        image: processImageUrlInSlice(item),
        description: item.description || '',
        discount: parseInt(item.discount) || 0,
        rating: parseFloat(item.rating) || 0,
        quantity: parseInt(item.quantity) || 0,
        wishlist: true
      }))
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist')
    }
  }
)

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productData, { rejectWithValue }) => {
    try {
      if (!productData || !productData.productId) return rejectWithValue('Product ID is required')
      const wishlistData = {
        productId: productData.productId,
        name: productData.name || 'Unknown Product',
        price: productData.price || 0,
        description: productData.description || '',
        discount: productData.discount || 0,
        rating: productData.rating || 0,
        bestseller: productData.bestseller || false,
        ...(productData.image && { image: productData.image }),
        ...(productData.images && { images: productData.images }),
        ...(productData.productImage && { productImage: productData.productImage }),
        ...(productData.colors && { colors: productData.colors }),
        ...(productData.sizes && { sizes: productData.sizes }),
        ...(productData.category && { category: productData.category }),
        ...(productData.brand && { brand: productData.brand }),
      }
      const response = await axios.post(`${backendUrl}/api/wishlist/add`, wishlistData, {
        headers: getHeaders(),
        timeout: 15000
      })
      if (response.data && response.data.success !== false) {
        const returnedProduct = response.data.product || response.data.item || response.data.data || productData
        return {
          id: returnedProduct.id || returnedProduct._id || productData.productId,
          name: returnedProduct.name || productData.name || 'Unknown Product',
          price: returnedProduct.price || productData.price || 0,
          image: processImageUrlInSlice(returnedProduct),
          description: returnedProduct.description || productData.description || '',
          discount: returnedProduct.discount || productData.discount || 0,
          rating: returnedProduct.rating || productData.rating || 0,
          bestseller: returnedProduct.bestseller || productData.bestseller || false,
          wishlist: true
        }
      } else {
        throw new Error(response.data?.message || 'Failed to add item to wishlist')
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        'Failed to add item to wishlist'
      )
    }
  }
)

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      let targetId = productId
      if (typeof productId === 'object' && productId !== null) {
        targetId = productId.productId || productId.id || productId._id
      }
      if (!targetId) return rejectWithValue('Product ID is required')
      await axios.delete(`${backendUrl}/api/wishlist/remove/${targetId}`, {
        headers: getHeaders(),
        timeout: 15000
      })
      return { productId: String(targetId), removedId: String(targetId) }
    } catch (error) {
      if (error.response?.status === 404 || error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        let targetId = typeof productId === 'object' ? (productId.productId || productId.id || productId._id) : productId
        return { productId: String(targetId), removedId: String(targetId) }
      }
      if (error.response?.status === 401) {
        return rejectWithValue('Authentication failed. Please log in again.')
      }
      return rejectWithValue(
        error.response?.data?.message ||
        error.message ||
        'Failed to remove item from wishlist'
      )
    }
  }
)

export const clearWishlist = createAsyncThunk(
  'wishlist/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await axios.delete(`${backendUrl}/api/wishlist/clear`, { headers: getHeaders() })
      return true
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
    error: null,
    isAuthenticated: false,
    lastUpdated: null,
    shouldRefresh: false
  },
  reducers: {
    setAuthentication: (state, action) => {
      state.isAuthenticated = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    resetWishlist: (state) => {
      state.items = []
      state.error = null
      state.loading = false
      state.lastUpdated = null
      state.shouldRefresh = false
    },
    triggerRefresh: (state) => {
      state.shouldRefresh = true
      state.lastUpdated = Date.now()
    },
    resetRefreshFlag: (state) => {
      state.shouldRefresh = false
    },
    toggleWishlistItem: (state, action) => {
      const productId = action.payload
      const existingIndex = state.items.findIndex(item => item.id === productId)
      if (existingIndex >= 0) {
        state.items.splice(existingIndex, 1)
      }
      state.lastUpdated = Date.now()
      state.shouldRefresh = true
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlistItems.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWishlistItems.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.error = null
        state.lastUpdated = Date.now()
        state.shouldRefresh = false
      })
      .addCase(fetchWishlistItems.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.shouldRefresh = false
      })
      .addCase(addToWishlist.pending, (state) => {
        state.error = null
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        const newItem = action.payload
        if (newItem && !state.items.some(item => item.id === newItem.id)) {
          state.items.push(newItem)
        }
        state.error = null
        state.lastUpdated = Date.now()
        state.shouldRefresh = true
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(removeFromWishlist.pending, (state) => {
        state.error = null
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        const { productId, removedId } = action.payload
        const targetIdStr = String(productId || removedId || '').trim()
        state.items = state.items.filter(item => {
          const itemId = String(item.id || '').trim()
          const itemProductId = String(item.productId || '').trim()
          const itemMongoId = String(item._id || '').trim()
          return itemId !== targetIdStr && itemProductId !== targetIdStr && itemMongoId !== targetIdStr
        })
        state.error = null
        state.lastUpdated = Date.now()
        state.shouldRefresh = true
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(clearWishlist.pending, (state) => {
        state.error = null
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.items = []
        state.error = null
        state.lastUpdated = Date.now()
        state.shouldRefresh = true
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const { 
  setAuthentication, 
  clearError, 
  resetWishlist, 
  toggleWishlistItem, 
  triggerRefresh, 
  resetRefreshFlag 
} = wishlistSlice.actions

export default wishlistSlice.reducer

// Selectors
export const selectWishlistState = (state) => state.wishlist || {}
export const selectWishlistItems = (state) => state.wishlist?.items || []
export const selectIsAuthenticated = (state) => state.wishlist?.isAuthenticated || false

export const selectIsProductInWishlist = createSelector(
  [selectWishlistItems, (_, productId) => productId],
  (items, productId) => {
    if (!productId || !Array.isArray(items)) return false
    return items.some(item => 
      item.id === productId || 
      item.productId === productId || 
      item._id === productId ||
      String(item.id) === String(productId) ||
      String(item.productId) === String(productId) ||
      String(item._id) === String(productId)
    )
  }
)

export const selectShouldRefresh = (state) => state.wishlist?.shouldRefresh || false
export const selectLastUpdated = (state) => state.wishlist?.lastUpdated || null
