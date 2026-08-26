import React, { useEffect, useState, useMemo } from 'react'
import { 
  ArrowLeft, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Trash2,
  AlertCircle,
  Loader2,
  CreditCard,
  Truck,
  Check
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import BrandLoader from '../common/BrandLoader'
import { toast } from 'react-toastify'
import {
  fetchCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  clearError,
  toggleItemSelection,
  selectAllItems,
  deselectAllItems,
  selectSelectedItems
} from '../../store/slices/cartSlice'
import { handleImageError } from '../../utils/imageUtils'

// Normalize presence flags in localStorage and helpers
const normalizeLocalStorageFlags = () => {
  try {
    if (localStorage.getItem('authToken')) localStorage.setItem('hasAuthToken', 'true')
    if (localStorage.getItem('token')) localStorage.setItem('hasToken', 'true')
    if (localStorage.getItem('userId') || localStorage.getItem('userEmail')) localStorage.setItem('isLoggedIn', 'true')
    if (localStorage.getItem('razorpayid') || localStorage.getItem('razorpayOrderId') || localStorage.getItem('razorpay_order_id')) {
      localStorage.setItem('hasRazorpayId', 'true')
    }
  } catch (e) {
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

// Helper Components
const ColorSwatch = ({ color }) => (
  <div 
    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 flex-shrink-0" 
    style={{ backgroundColor: color }}
    title={color}
  />
)

const SizeBadge = ({ size }) => (
  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded whitespace-nowrap">
    {size}
  </span>
)

const Cart = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // ensure normalized flags exist on component mount
  useEffect(() => {
    normalizeLocalStorageFlags()
  }, [])

  // Redux state
  const {
    items: cartItems,
    loading,
    error,
    updating,
    totalItems,
    subtotal,
    shipping,
    total
  } = useSelector((state) => state.cart)
  const selectedItems = useSelector(selectSelectedItems)
  
  // Enhanced authentication check with multiple fallbacks
  const checkAuthentication = () => {
    const authToken = localStorage.getItem('authToken')
    const token = localStorage.getItem('token')
    const userEmail = localStorage.getItem('userEmail')
    const userId = localStorage.getItem('userId')
    const userName = localStorage.getItem('userName')
    
    // Check if any authentication data exists or normalized flags
    return !!(
      authToken ||
      token ||
      userEmail ||
      userId ||
      userName ||
      getLocalBoolean('hasAuthToken') ||
      getLocalBoolean('hasToken') ||
      getLocalBoolean('isLoggedIn')
    )
  }

  // Selection helpers
  const allSelected = cartItems.length > 0 && cartItems.every(item => selectedItems.includes(item.itemId || item.productId || item.id))
  const selectedCount = selectedItems.length
  const selectedSubtotal = cartItems
    .filter(item => selectedItems.includes(item.itemId || item.productId || item.id))
    .reduce((sum, item) => {
      const itemPrice = item.discount > 0
        ? item.price - (item.price * item.discount / 100)
        : item.price
      return sum + (itemPrice * item.quantity)
    }, 0)
  const selectedShipping = selectedSubtotal >= 999 ? 0 : 49
  const selectedTotal = selectedSubtotal + selectedShipping

  const isAuthenticated = useMemo(() => checkAuthentication(), [])

  // Fetch cart on component mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart())
    }
  }, [dispatch, isAuthenticated])

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  // Handler functions with toast notifications
  const handleUpdateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(item)
      return
    }
    
    try {
      await dispatch(updateCartQuantity({ 
        itemId: item.itemId || item.id,
        productId: item.productId || item.id,
        quantity: newQuantity 
      })).unwrap()
      
      // Success toast
      toast.success(`Updated quantity to ${newQuantity}`, {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } catch (error) {
      console.error('Failed to update quantity:', error)
      toast.error('Failed to update quantity. Please try again.', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }

  const handleRemoveItem = async (item) => {
    try {
      await dispatch(removeFromCart({ 
        itemId: item.itemId || item.id,
        productId: item.productId || item.id
      })).unwrap()
      
      // Success toast
      toast.success(`${item.name} removed from cart`, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    } catch (error) {
      console.error('Failed to remove item:', error)
      toast.error('Failed to remove item. Please try again.', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await dispatch(clearCart()).unwrap()
        
        // Success toast
        toast.success('Cart cleared successfully', {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      } catch (error) {
        console.error('Failed to clear cart:', error)
        toast.error('Failed to clear cart. Please try again.', {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    }
  }

  const handleProceedToCheckout = () => {
    // Double check authentication before proceeding
    const isStillAuthenticated = checkAuthentication()
    
    if (!isStillAuthenticated) {
      // Store current cart data before redirecting to login
      const cartData = {
        items: cartItems,
        subtotal,
        shipping,
        total
      }
      localStorage.setItem('pendingCheckout', JSON.stringify(cartData))
      
      toast.info('Please login to proceed with checkout', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      
      navigate('/login', { 
        state: { 
          from: '/cart',
          message: 'Please login to proceed with checkout',
          returnTo: '/checkout'
        } 
      })
      return
    }

    if (!cartItems || cartItems.length === 0) {
      toast.warning('Your cart is empty', {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      return
    }

    if (selectedCount === 0) {
      toast.warning('Please select at least one item to checkout', {
        position: "bottom-right",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
      return
    }

    // Store only selected items in checkout data
    const checkoutItems = cartItems.filter(item =>
      selectedItems.includes(item.itemId || item.productId || item.id)
    )
    const checkoutData = {
      items: checkoutItems,
      selectedItemIds: checkoutItems.map(i => i.itemId || i.productId || i.id),
      subtotal: selectedSubtotal,
      shipping: selectedShipping,
      total: selectedTotal,
      timestamp: Date.now()
    }
    
    localStorage.setItem('checkoutData', JSON.stringify(checkoutData))
    
    // Success toast
    toast.success('Proceeding to checkout...', {
      position: "bottom-right",
      autoClose: 1500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
    
    // Navigate to checkout
    navigate('/checkout')
  }

  const handleContinueShopping = () => {
    navigate('/collections')
  }

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }
  }, [error])

  // Loading state
  if (loading) {
    return <BrandLoader label="Loading your cart" fullScreen />
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Cart</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              dispatch(fetchCart())
              toast.info('Retrying...', {
                position: "bottom-right",
                autoClose: 1500,
              })
            }}
            className="bg-[#E72744] text-white px-4 py-2 rounded-lg hover:bg-[#C81E38] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Empty cart state
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center">
              <button
                onClick={handleContinueShopping}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm sm:text-base">Continue Shopping</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty cart content */}
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
          <button
            onClick={handleContinueShopping}
            className="bg-[#E72744] text-white px-6 py-3 rounded-lg hover:bg-[#C81E38] transition-colors font-medium"
          >
            Start Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleContinueShopping}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm sm:text-base">Continue Shopping</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {/* Select All checkbox */}
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <div
                  onClick={() => allSelected ? dispatch(deselectAllItems()) : dispatch(selectAllItems())}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    allSelected ? 'bg-[#E72744] border-[#E72744]' : 'border-gray-400 hover:border-gray-600'
                  }`}
                >
                  {allSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-600">
                  {allSelected ? 'Deselect All' : 'Select All'}
                </span>
              </label>
              <span className="text-gray-600">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              <button 
                onClick={handleClearCart} 
                className="text-red-600 hover:text-red-700 font-medium transition-colors"
                disabled={loading}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.itemId || item.productId}
                className={`flex flex-col sm:flex-row items-start sm:items-center bg-white p-4 sm:p-6 rounded-lg shadow-sm border gap-4 transition-colors ${
                  selectedItems.includes(item.itemId || item.productId || item.id)
                    ? 'border-[#E72744]/30 bg-red-50/30'
                    : 'border-gray-200'
                }`}
              >
                {/* Selection Checkbox */}
                <div
                  onClick={() => dispatch(toggleItemSelection(item.itemId || item.productId || item.id))}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${
                    selectedItems.includes(item.itemId || item.productId || item.id)
                      ? 'bg-[#E72744] border-[#E72744]'
                      : 'border-gray-400 hover:border-gray-600'
                  }`}
                >
                  {selectedItems.includes(item.itemId || item.productId || item.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>

                {/* Product Image */}
                <div className="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => handleImageError(e, item.name)}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  {/* Color and Size */}
                  <div className="flex items-center space-x-4 mb-2">
                    {item.selectedColor && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Color:</span>
                        <ColorSwatch color={item.selectedColor} />
                      </div>
                    )}
                    {item.selectedSize && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Size:</span>
                        <SizeBadge size={item.selectedSize} />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    {item.discount > 0 ? (
                      <>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{((item.price || 0) - ((item.price || 0) * (item.discount || 0) / 100)).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{(item.price || 0).toFixed(2)}
                        </span>
                        <span className="text-sm text-green-600 font-medium">
                          {item.discount}% off
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        ₹{(item.price || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity Controls and Actions */}
                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center w-full sm:w-auto gap-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleUpdateQuantity(item, (item.quantity || 1) - 1)}
                      disabled={updating[item.itemId || item.productId] || (item.quantity || 1) <= 1}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
                      {updating[item.itemId || item.productId] ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        item.quantity || 1
                      )}
                    </span>
                    
                    <button
                      onClick={() => handleUpdateQuantity(item, (item.quantity || 1) + 1)}
                      disabled={updating[item.itemId || item.productId]}
                      className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item)}
                    disabled={updating[item.itemId || item.productId]}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
              
              {selectedCount > 0 && (
                <p className="text-sm text-gray-500">{selectedCount} item{selectedCount !== 1 ? 's' : ''} selected</p>
              )}

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{(selectedSubtotal || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  {selectedShipping === 0 ? (
                    <span className="font-medium text-green-600">FREE</span>
                  ) : (
                    <span className="font-medium">₹{selectedShipping.toFixed(2)}</span>
                  )}
                </div>

                {selectedSubtotal > 0 && selectedSubtotal < 999 && (
                  <p className="text-xs text-gray-500">
                    Add ₹{(999 - selectedSubtotal).toFixed(2)} more for free shipping
                  </p>
                )}
                
                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{(selectedTotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                disabled={selectedCount === 0}
                className="w-full bg-[#E72744] text-white py-3 rounded-lg hover:bg-[#C81E38] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Proceed to Checkout
              </button>

              {selectedCount === 0 && cartItems.length > 0 && (
                <p className="text-xs text-center text-gray-500">Select items above to checkout</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
