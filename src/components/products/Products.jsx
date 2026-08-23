
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

// Import the wishlist actions and selectors
import { 
  addToWishlist, 
  removeFromWishlist,
  selectWishlistItems,
  selectIsProductInWishlist,
  selectIsAuthenticated
} from '../../store/slices/wishlistSlice'

const Products = ({ 
    id, 
    name, 
    image, 
    price, 
    discount = 0, 
    rating = 0, 
    bestseller = false, 
    wishlist = false, 
    description = '', 
    category,
    subscategory
}) => {
    const navigate = useNavigate()
    const [isWishlisted, setIsWishlisted] = useState(wishlist)
    const [imageError, setImageError] = useState(false)
    const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)

    // Ensure id is properly formatted and exists
    const productId = id || 'unknown'
    const productShareLink = `/products/${productId}`
    
    const dispatch = useDispatch();
    
    // Use imported selectors
    const isAuthenticated = useSelector(selectIsAuthenticated)
    const isInWishlist = useSelector(state => selectIsProductInWishlist(state, id))

    // Enhanced authentication check - similar to what you have in Cart.jsx
    const tokenFromStorage = localStorage.getItem('authToken') || localStorage.getItem('token')
    const userEmailFromStorage = localStorage.getItem('userEmail')
    const userIdFromStorage = localStorage.getItem('userId')
    const userNameFromStorage = localStorage.getItem('userName')

    const isUserAuthenticated = isAuthenticated || 
        !!tokenFromStorage || 
        !!(userEmailFromStorage || userIdFromStorage || userNameFromStorage)
    
    // Update local state when Redux wishlist changes
    useEffect(() => {
        setIsWishlisted(isInWishlist || wishlist)
    }, [isInWishlist, wishlist])
    
    const handleProductClick = () => {
        if (id) {
            navigate(`/products/${id}`)
        } else {
            console.error('Product ID is missing')
        }
    }

    // Fixed typos and logic
    const shortDescription = description.slice(0, 60) + (description.length > 60 ? '...' : '')
    const img = Array.isArray(image) && image.length > 0 ? image[0] : (typeof image === 'string' ? image : null)
    // Replace the salePrice calculation (around line 65)
    const salePrice = discount > 0 ? (price - (price * discount / 100)) : price

    // Generate star rating - Fixed the unique ID issue
    const renderStars = (rating) => {
        const stars = []
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 !== 0
        const uniqueId = `${id}-${Math.random().toString(36).substr(2, 9)}` // Generate unique ID

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push(
                    <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-gold-500 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                )
            } else if (i === fullStars && hasHalfStar) {
                stars.push(
                    <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-gold-500" viewBox="0 0 20 20">
                        <defs>
                            <linearGradient id={`half-${uniqueId}`}>
                                <stop offset="50%" stopColor="currentColor"/>
                                <stop offset="50%" stopColor="transparent"/>
                            </linearGradient>
                        </defs>
                        <path fill={`url(#half-${uniqueId})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                )
            } else {
                stars.push(
                    <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                )
            }
        }
        return stars
    }

    // Fixed the toggleWishlist function
    const toggleWishlist = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        if (isAddingToWishlist) return // Prevent multiple clicks
        
        // Check if product ID exists
        if (!id || id === 'unknown') {
            console.error('Cannot add to wishlist: Product ID is missing')
            alert('Unable to add to wishlist: Product information is incomplete')
            return
        }
        
        setIsAddingToWishlist(true)
        
        try {
            if (!isUserAuthenticated) {
                // If not authenticated, show login prompt immediately
                const shouldLogin = window.confirm('Please login to save items to your wishlist. Would you like to login now?')
                if (shouldLogin) {
                    navigate('/login', { state: { from: window.location.pathname } })
                }
                return
            }

            // If authenticated, dispatch appropriate action
            if (isWishlisted || isInWishlist) {
                console.log('ðŸ—‘ï¸ Removing from wishlist:', id)
                // Pass just the product ID as a string
                await dispatch(removeFromWishlist(String(id))).unwrap()
            } else {
                // Pass complete product data
                const wishlistData = {
                    productId: String(id), // Ensure it's a string
                    name: name || 'Unknown Product',
                    price: parseFloat(price) || 0,
                    description: description || '',
                    discount: discount || 0,
                    rating: rating || 0,
                    bestseller: bestseller || false,
                    // Send the original image data as received from props
                    image: image,
                    // If image is an array, also send it as images
                    images: Array.isArray(image) ? image : (image ? [image] : []),
                    productImage: image
                }
                
                console.log('âž• Adding to wishlist from Products component:', wishlistData)
                await dispatch(addToWishlist(wishlistData)).unwrap()
            }
            
            // Success feedback
            console.log('âœ… Wishlist operation completed successfully')
            
        } catch (error) {
            console.error('âŒ Wishlist operation failed:', error)
            
            // More detailed error handling
            let errorMessage = 'Failed to update wishlist. Please try again.'
            
            if (error?.message) {
                errorMessage = error.message
            } else if (typeof error === 'string') {
                errorMessage = error
            }
            
            // Log more details for debugging
            console.error('Error details:', {
                error,
                productId: id,
                isWishlisted,
                isInWishlist,
                isUserAuthenticated
            })
            
            // Show user-friendly error message
            if (errorMessage.includes('authentication') || errorMessage.includes('login') || errorMessage.includes('token')) {
                alert('Your session has expired. Please log in again.')
                navigate('/login', { state: { from: window.location.pathname } })
            } else {
                alert(errorMessage)
            }
            
        } finally {
            setIsAddingToWishlist(false)
        }
    }

    const handleAddToCart = (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        dispatch({ 
            type: 'cart/addToCart', 
            payload: {
                id,
                name,
                image: img,
                price: parseFloat(salePrice),
                originalPrice: price,
                quantity: 1
            }
        })
        
        // Optional: Show success toast/notification
    }

    const handleImageError = () => {
        setImageError(true)
    }

    return (
        <div 
            className="card-luxury group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer ring-1 ring-ink-100 hover:ring-gold-300/60"
            onClick={handleProductClick}
        >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-ink-50">
                {/* Badges */}
                <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
                    {bestseller && (
                        <span className="bg-ink-950 text-gold-300 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md ring-1 ring-gold-500/30">
                            Bestseller
                        </span>
                    )}
                    {discount > 0 && (
                        <span className="glass-light text-gold-800 text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-sm ring-1 ring-gold-300">
                            âˆ’{discount}%
                        </span>
                    )}
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={toggleWishlist}
                    disabled={isAddingToWishlist}
                    className={`absolute top-3 right-3 z-10 p-2 glass-light rounded-full shadow-sm ring-1 ring-ink-100 transition-all duration-300 group/wishlist ${
                        isAddingToWishlist ? 'opacity-60 cursor-not-allowed' : 'hover:bg-white hover:ring-gold-300 hover:scale-110'
                    }`}
                    title={isWishlisted || isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    {isAddingToWishlist ? (
                        <svg className="w-4 h-4 animate-spin text-ink-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg 
                            className={`w-4 h-4 transition-all duration-300 ${
                                isWishlisted 
                                    ? 'text-red-500 fill-current scale-110' 
                                    : 'text-ink-400 group-hover/wishlist:text-red-500'
                            }`} 
                            fill={isWishlisted ? 'currentColor' : 'none'} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )}
                </button>

                {/* Product Image */}
                {img && !imageError ? (
                    <img
                        src={img}
                        alt={name}
                        onError={handleImageError}
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[900ms] ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-ink-50">
                        <svg className="w-12 h-12 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Quick View Overlay */}
                <div className="absolute inset-x-0 bottom-0 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hidden sm:block">
                    <div className="mx-3 mb-3 glass-dark rounded-full py-2.5 text-center">
                        <span className="text-cream text-[11px] font-semibold uppercase tracking-[0.22em]">Quick View</span>
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-4 sm:p-5 space-y-2 sm:space-y-2.5 bg-white">
                {/* Rating */}
                {rating > 0 && (
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                            {renderStars(rating)}
                        </div>
                        <span className="text-xs text-ink-400">({rating.toFixed(1)})</span>
                    </div>
                )}

                {/* Product Name */}
                <h3 className="font-serif font-medium text-ink-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-gold-800 transition-colors duration-300">
                    {name}
                </h3>

                {/* Description - Hidden on mobile */}
                {description && (
                    <p className="text-ink-400 text-xs leading-relaxed line-clamp-2 hidden sm:block">
                        {shortDescription}
                    </p>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                    <span className="font-serif text-base sm:text-lg font-bold text-ink-950">
                        ₹{Math.round(salePrice).toLocaleString('en-IN')}
                    </span>
                    {discount > 0 && (
                        <>
                            <span className="text-xs text-ink-300 line-through decoration-red-400/70">
                                ₹{Math.round(price).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] font-semibold text-[#C81E38] bg-[#FFE0E5] px-1.5 py-0.5 rounded">
                                Save ₹{Math.round(price - salePrice).toLocaleString('en-IN')}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Products
