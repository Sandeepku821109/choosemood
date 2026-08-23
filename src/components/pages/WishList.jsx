import React, { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchWishlistItems,
  removeFromWishlist,
  clearWishlist,
  setAuthentication,
  resetWishlist,
  clearError,
  resetRefreshFlag,
  selectShouldRefresh,
  selectLastUpdated
} from '../../store/slices/wishlistSlice.js'
import { useDispatch, useSelector } from 'react-redux'
import Products from '../products/Products'
import { backendUrl } from '../../config'

const WishList = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  // Get state from Redux store
  const { 
    items: wishListItems, 
    loading, 
    error, 
    isAuthenticated 
  } = useSelector((state) => state.wishlist)
  
  // Get refresh indicators
  const shouldRefresh = useSelector(selectShouldRefresh)
  const lastUpdated = useSelector(selectLastUpdated)

  // Memoized refresh function
  const refreshWishlist = useCallback(() => {
    console.log('🔄 Refreshing wishlist...')
    if (isAuthenticated) {
      dispatch(fetchWishlistItems())
    }
  }, [dispatch, isAuthenticated])

  // Auto-refresh when shouldRefresh flag is set
  useEffect(() => {
    if (shouldRefresh && isAuthenticated) {
      console.log('🔄 Auto-refresh triggered by state change')
      refreshWishlist()
      // Reset the refresh flag after triggering refresh
      dispatch(resetRefreshFlag())
    }
  }, [shouldRefresh, isAuthenticated, refreshWishlist, dispatch])

  // Listen for wishlist changes from other components
  useEffect(() => {
    const handleWishlistChange = (event) => {
      console.log('📡 Received wishlist change event:', event.detail)
      if (event.detail?.action === 'added' || event.detail?.action === 'removed') {
        refreshWishlist()
      }
    }

    // Listen for custom events from other components
    window.addEventListener('wishlistChanged', handleWishlistChange)
    
    return () => {
      window.removeEventListener('wishlistChanged', handleWishlistChange)
    }
  }, [refreshWishlist])

  // Refresh on visibility change (when user comes back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log('👁️ Page became visible, refreshing wishlist')
        refreshWishlist()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshWishlist, isAuthenticated])

  // Add debugging for Redux state changes
  useEffect(() => {
    console.log('🔍 WishList Component - Redux State Debug:')
    console.log('  - wishListItems:', wishListItems)
    console.log('  - loading:', loading)
    console.log('  - error:', error)
    console.log('  - isAuthenticated:', isAuthenticated)
    console.log('  - shouldRefresh:', shouldRefresh)
    console.log('  - lastUpdated:', lastUpdated)
  }, [wishListItems, loading, error, isAuthenticated, shouldRefresh, lastUpdated])

  // Process image URLs and ensure correct ID mapping
  const processedWishlistItems = React.useMemo(() => {
    console.log('🖼️ Processing wishlist images and IDs...')
    console.log('  - Raw wishListItems count:', wishListItems.length)
    
    return wishListItems.map((item, index) => {
      console.log(`🔄 Processing item ${index + 1}/${wishListItems.length}:`, item)

      // Extract possible id sources
      let rawId = item.productId || item.id || item._id || (item.product && (item.product._id || item.product.id || item.product))
      console.log('  - rawId (pre-normalize):', rawId)

      // If id is an array, use first element
      if (Array.isArray(rawId) && rawId.length > 0) rawId = rawId[0]

      // If id is an object, try common fields or toString()
      let productId = null
      if (rawId && typeof rawId === 'object') {
        productId = rawId._id || rawId.id || rawId['$oid'] || rawId.toString()
      } else if (rawId != null) {
        productId = String(rawId)
      }

      // fallback if still missing
      if (!productId || productId === 'undefined') {
        productId = item.slug || item.sku || `unknown-${index}-${Date.now()}`
        console.warn(`⚠️ Could not extract numeric id; using fallback id: ${productId}`)
      }

      // Process image same as before
      const image = item.image || item.images || item.productImage || item.thumbnail
      const img = Array.isArray(image) && image.length > 0 ? image[0] : (typeof image === 'string' ? image : null)
      let imageUrl = img
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        if (imageUrl.startsWith('/')) imageUrl = imageUrl.substring(1)
        imageUrl = `${backendUrl}/${imageUrl}`
      } else if (!imageUrl) {
        imageUrl =
          'data:image/svg+xml;utf8,' +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#f3f4f6"/><text x="150" y="155" font-family="sans-serif" font-size="20" fill="#9ca3af" text-anchor="middle">No Image</text></svg>`
          )
      }

      const processedItem = {
        ...item,
        id: productId,           // normalized string id
        productId: productId,    // keep both fields consistent
        image: imageUrl
      }

      console.log('  - Final processed item:', processedItem)
      return processedItem
    })
  }, [wishListItems, backendUrl])

  // Enhanced debugging for processed items
  React.useEffect(() => {
    console.log('📊 Wishlist Items Comparison:')
    console.log('  - Original count:', wishListItems.length)
    console.log('  - Processed count:', processedWishlistItems.length)
    console.log('  - Original items:', wishListItems)
    console.log('  - Processed items:', processedWishlistItems)
    
    // Check for image processing issues and ID validation
    processedWishlistItems.forEach((item, index) => {
      if (item.image.includes('placeholder')) {
        console.warn(`⚠️ Item ${index + 1} (${item.name}) is using placeholder image`)
      }
      if (!item.id || item.id === 'unknown') {
        console.error(`❌ Item ${index + 1} (${item.name}) has invalid ID: ${item.id}`)
      }
    })
  }, [wishListItems, processedWishlistItems])

  // Check authentication on mount
  useEffect(() => {
    console.log('🔐 Checking authentication on component mount...')
    checkAuthentication()
  }, [])

  // Fetch wishlist when authenticated
  useEffect(() => {
    console.log('🔄 Authentication state changed:', isAuthenticated)
    if (isAuthenticated) {
      console.log('✅ User authenticated, fetching wishlist items...')
      dispatch(fetchWishlistItems())
    } else {
      console.log('❌ User not authenticated, resetting wishlist...')
      dispatch(resetWishlist())
    }
  }, [isAuthenticated, dispatch])

  // Debug error state
  useEffect(() => {
    if (error) {
      console.error('❌ Wishlist Error:', error)
    }
  }, [error])

  const checkAuthentication = () => {
    try {
      console.log('🔍 Checking authentication tokens...')
      const authToken = localStorage.getItem('authToken')
      const token = localStorage.getItem('token')
      const userEmail = localStorage.getItem('userEmail')

      console.log('  - authToken:', authToken ? 'Present' : 'Missing')
      console.log('  - token:', token ? 'Present' : 'Missing')
      console.log('  - userEmail:', userEmail ? userEmail : 'Missing')

      if (authToken || token || userEmail) {
        console.log('✅ Authentication tokens found, setting authenticated state')
        dispatch(setAuthentication(true))
      } else {
        console.log('❌ No authentication tokens found, setting unauthenticated state')
        dispatch(setAuthentication(false))
      }
    } catch (error) {
      console.error('❌ Authentication check failed:', error)
      dispatch(setAuthentication(false))
    }
  }

  // Update the handleRemoveFromWishlist function
  const handleRemoveFromWishlist = (productId) => {
    console.log('🗑️ Removing item from wishlist:', productId)
    // Pass the productId directly, not as an object
    dispatch(removeFromWishlist(productId))
  }

  const handleClearAll = () => {
    console.log('🧹 Clearing all wishlist items...')
    dispatch(clearWishlist())
  }

  const handleLogin = () => {
    console.log('🔑 Navigating to login page...')
    navigate('/login')
  }

  const handleLogout = () => {
    console.log('🚪 Logging out user...')
    localStorage.removeItem('authToken')
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    dispatch(setAuthentication(false))
    dispatch(resetWishlist())
    navigate('/login')
  }

  // Update the handleProductClick function
  const handleProductClick = (item) => {
    if (!item) return
    // Use normalized id (string) placed in processedWishlistItems
    const productId = item.id || item.productId
    if (!productId) {
      console.error('No valid product id to navigate to:', item)
      return
    }
    navigate(`/products/${productId}`)
  }

  // Update the renderWishlistItems function to ensure proper ID extraction
  const renderWishlistItems = () => {
    console.log('🎨 Rendering wishlist items, count:', processedWishlistItems.length)
    
    if (processedWishlistItems.length === 0) {
      console.log('📭 No wishlist items to display, showing empty state')
      return (
        <div className="text-center text-gray-600 mt-12">
          <div className="max-w-md mx-auto">
            <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Start adding products you love to your wishlist</p>
            <button
              onClick={() => navigate('/collections')}
              className="bg-[#E72744] hover:bg-[#C81E38] text-white py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Browse Products
            </button>
          </div>
        </div>
      )
    }

    console.log('📦 Rendering product grid with items:', processedWishlistItems.map(item => ({ id: item.id, name: item.name, image: item.image })))

    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {processedWishlistItems.map((item, index) => {
          // Ensure we have a valid product ID
          const productId = item.id || item.productId || item._id
          
          console.log(`🎯 Rendering product ${index + 1}: ${item.name} with ID: ${productId}`)
          
          // Validate item before rendering
          if (!productId || productId === 'unknown') {
            console.error(`❌ Skipping item with invalid ID: ${item.name}`)
            return null
          }
          
          return (
            <div key={productId} className="relative">
              <div onClick={() => handleProductClick(item)}>
                <Products
                  id={item.id} // use normalized string id
                  name={item.name}
                  image={item.image}
                  price={item.price}
                  discount={item.discount}
                  rating={item.rating}
                  bestseller={item.bestseller}
                  wishlist={true}
                  description={item.description}
                  onImageError={(e) => {
                    console.error(`🖼️ Image failed to load for item ${item.name}:`)
                    console.error('  - Image URL:', item.image)
                    console.error('  - Error event:', e)
                    console.error('  - Original item data:', item)
                  }}
                />
              </div>
              {/* Remove from wishlist button overlay */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`🗑️ Remove button clicked for item: ${productId} (${item.name})`)
                  handleRemoveFromWishlist(productId); // Pass ID directly
                }}
                className="absolute top-2 left-2 z-20 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors duration-200"
                title="Remove from wishlist"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    console.log('⏳ Showing loading state...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E72744] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('🔒 Showing authentication required state...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-[#FFE0E5] rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#E72744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your wishlist and save your favorite items.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-[#E72744] hover:bg-[#C81E38] text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering main wishlist component...')
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">
              {processedWishlistItems.length > 0 
                ? `${processedWishlistItems.length} item${processedWishlistItems.length !== 1 ? 's' : ''} saved for later`
                : 'Items you save will appear here'
              }
            </p>
          </div>
          <div className="flex space-x-3">
            {processedWishlistItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                Clear All
              </button>
            )}
           
          </div>
        </div>
        {renderWishlistItems()}
      </div>
    </div>
  )
}

export default WishList

// In your Login.jsx or Otp.jsx
const handleLoginSuccess = (response) => {
    // Store auth data
    localStorage.setItem('authToken', response.data.token)
    localStorage.setItem('userName', response.data.name || response.data.email.split('@')[0])
    
    // Trigger username update
    window.dispatchEvent(new Event('username-updated'))
    window.dispatchEvent(new Event('auth-change'))
}
