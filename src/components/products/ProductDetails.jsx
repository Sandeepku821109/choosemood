import axios from 'axios'
import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice'
import { addToCart } from '../../store/slices/cartSlice'
import { fetchAddress } from '../../store/slices/addressSlice'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  Heart,
  Share2,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  X,
  Truck,
  RefreshCw,
  ShieldCheck,
  Tag,
  Layers,
  Calendar
} from 'lucide-react'
import RelatedProduct from '../relatedProudct/RelatedProduct'
import SmilarProduct from './SmilarProduct'

const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><rect width="800" height="800" fill="#f3f4f6"/><g fill="none" stroke="#9ca3af" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><rect x="260" y="300" width="280" height="220" rx="16"/><circle cx="350" cy="380" r="28"/><path d="M270 490l80-80 60 60 50-50 70 70"/></g><text x="400" y="600" font-family="sans-serif" font-size="32" fill="#9ca3af" text-anchor="middle">No Image</text></svg>`
  )

const formatINR = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  // Redux
  const wishlist = useSelector(state => state.wishlist?.items || [])
  const savedAddresses = useSelector(state => state.address?.addresses || [])

  // State
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // sizes -> quantity map (normalized from backend)
  const [sizeMap, setSizeMap] = useState({})

  const [pincode, setPincode] = useState('')
  const [pincodeStatus, setPincodeStatus] = useState('') // '', checking, available, unavailable, invalid
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [isPincodeVerified, setIsPincodeVerified] = useState(false)
  const [pincodeSource, setPincodeSource] = useState('') // '', 'address', 'saved'

  const [showValidationPopup, setShowValidationPopup] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')

  // Normalize image entry (string or object) and prefix baseUrl for relative paths
  const normalizeImageUrl = (img) => {
    if (!img) return null
    let src = img
    if (typeof img === 'object') {
      src = img.url || img.src || img.path || img.image || ''
    }
    if (!src) return null
    if (src.startsWith('http') || src.startsWith('data:')) return src
    if (!src.startsWith('/')) src = `/${src}`
    return baseUrl.replace(/\/$/, '') + src
  }

  // Normalized images array
  const images = useMemo(() => {
    if (!product) return []
    const raw =
      Array.isArray(product.images) && product.images.length
        ? product.images
        : Array.isArray(product.image) && product.image.length
        ? product.image
        : product.image
        ? [product.image]
        : []
    return raw.map(normalizeImageUrl).filter(Boolean)
  }, [product])

  // Fetch product
  useEffect(() => {
    if (!id) {
      setError('Product ID missing')
      setLoading(false)
      return
    }
    const fetchProductDetails = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await axios.get(`${baseUrl}/api/products/${id}`)
        const prod = res.data?.product || res.data?.data || res.data || null
        if (!prod) throw new Error('Product not found in response')
        setProduct(prod)
        setSelectedImage(0)
        setSelectedSize('')
        setQuantity(1)
      } catch (err) {
        console.error('Fetch product error:', err)
        let msg = 'Failed to load product'
        if (err.response?.status === 404) msg = 'Product not found'
        else if (err.response?.status === 400) msg = 'Invalid product ID'
        else if (err.response?.data?.message) msg = err.response.data.message
        else if (err.message) msg = err.message
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchProductDetails()
  }, [id])

  // wishlist sync
  useEffect(() => {
    if (!product) return
    const productId = String(product.id || product._id || '')
    const inWishlist = wishlist.some(i =>
      String(i?.id ?? '') === productId ||
      String(i?.productId ?? '') === productId ||
      String(i?._id ?? '') === productId
    )
    setIsWishlisted(!!inWishlist)
  }, [product, wishlist])

  // Pincode check — tolerant to response shapes
  const checkPincode = async (pin) => {
    if (!pin || pin.length !== 6) {
      setPincodeStatus('invalid')
      setDeliveryInfo(null)
      setIsPincodeVerified(false)
      return
    }
    setPincodeStatus('checking')
    setDeliveryInfo(null)
    setIsPincodeVerified(false)

    try {
      const res = await axios.get(`${baseUrl}/api/pincode`)
      const data = res.data?.data ?? res.data
      let found = false

      if (Array.isArray(data)) {
        found = data.some(entry => {
          if (entry == null) return false
          const v = typeof entry === 'object' ? (entry.pincode ?? entry.pin ?? entry.code ?? entry) : entry
          return String(v) === String(pin)
        })
      } else if (typeof data === 'object' && data !== null) {
        found = Object.keys(data).some(k => String(k) === String(pin))
      }

      if (found) {
        setPincodeStatus('available')
        setDeliveryInfo({ estimatedDelivery: '1 business day', codAvailable: true })
        setIsPincodeVerified(true)
        localStorage.setItem('detectedPincode', pin)
      } else {
        setPincodeStatus('unavailable')
        setDeliveryInfo(null)
        setIsPincodeVerified(false)
      }
    } catch (err) {
      console.error('Pincode check error:', err)
      // fallback: try single pincode endpoint
      try {
        const alt = await axios.get(`${baseUrl}/api/pincode/${pin}`)
        const ok = alt.data?.available ?? alt.data?.isServiceable ?? alt.data?.serviceable ?? false
        if (ok) {
          setPincodeStatus('available')
          setDeliveryInfo({ estimatedDelivery: alt.data?.eta || '2-4 business days', codAvailable: !!alt.data?.cod })
          setIsPincodeVerified(true)
          localStorage.setItem('detectedPincode', pin)
        } else {
          setPincodeStatus('unavailable')
          setDeliveryInfo(null)
          setIsPincodeVerified(false)
        }
      } catch (e) {
        console.error('Pincode alt check failed:', e)
        setPincodeStatus('unavailable')
        setDeliveryInfo(null)
        setIsPincodeVerified(false)
      }
    }
  }

  // debounce pincode input
  useEffect(() => {
    const t = setTimeout(() => {
      if (!pincode) {
        setPincodeStatus('')
        setDeliveryInfo(null)
        setIsPincodeVerified(false)
      } else if (pincode.length === 6) {
        checkPincode(pincode)
      } else {
        setPincodeStatus('invalid')
        setDeliveryInfo(null)
        setIsPincodeVerified(false)
      }
    }, 450)
    return () => clearTimeout(t)
  }, [pincode])

  // Auto-detect pincode: seed from last verified entry, then fetch account addresses
  useEffect(() => {
    const cached = localStorage.getItem('detectedPincode')
    if (cached && /^\d{6}$/.test(cached)) {
      setPincode(cached)
      setPincodeSource('saved')
    }
    if (localStorage.getItem('authToken') || localStorage.getItem('token')) {
      dispatch(fetchAddress())
    }
  }, [dispatch])

  // Prefer the default address's pincode once addresses load
  useEffect(() => {
    if (!savedAddresses.length) return
    const valid = a => /^\d{6}$/.test(String(a?.pincode || ''))
    const preferred = savedAddresses.find(a => a.isDefault && valid(a)) || savedAddresses.find(valid)
    if (preferred) {
      setPincode(String(preferred.pincode))
      setPincodeSource('address')
    }
  }, [savedAddresses])

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(value)
    setPincodeSource('')
  }

  const isUserAuthenticated = () => Boolean(localStorage.getItem('authToken') || localStorage.getItem('token'))

  const salePrice = product?.discount > 0
    ? Math.round(product.price - (product.price * product.discount) / 100)
    : Math.round(product?.price || 0)
  const savings = product?.discount > 0 ? Math.round((product.price || 0) - salePrice) : 0

  // Stock derived from sizeQuantity map (schema has no top-level quantity field)
  const hasSizes = Object.keys(sizeMap).length > 0
  const totalStock = hasSizes
    ? Object.values(sizeMap).reduce((a, b) => a + (Number(b) || 0), 0)
    : product?.quantity != null
      ? Number(product.quantity)
      : null
  const selectedSizeStock = hasSizes && selectedSize ? Number(sizeMap[selectedSize] || 0) : null
  const maxQty = hasSizes ? (selectedSizeStock ?? 0) : (totalStock != null ? totalStock : 10)
  const outOfStock = hasSizes ? totalStock <= 0 : totalStock != null && totalStock <= 0

  // clamp quantity when size/stock changes
  useEffect(() => {
    setQuantity(q => Math.min(Math.max(1, q), Math.max(1, maxQty)))
  }, [maxQty])

  // Average rating: prefer explicit rating, else average of reviews
  const avgRating = useMemo(() => {
    const explicit = product?.rating ?? product?.productRating
    if (explicit != null && Number(explicit) > 0) return Number(explicit)
    const list = Array.isArray(product?.reviews) ? product.reviews : []
    if (!list.length) return 0
    return list.reduce((s, r) => s + (Number(r?.rating) || 0), 0) / list.length
  }, [product])
  const reviews = Array.isArray(product?.reviews) ? product.reviews : []

  // Info panel — show everything available about the product
  const infoItems = [
    { label: 'Brand', value: product?.brand },
    { label: 'Product Code', value: product?.productCode || product?.sku || product?.code },
    { label: 'Category', value: product?.category },
    { label: 'Sub Category', value: product?.subCategory || product?.subcategory },
  ].filter(i => i.value)

  // keyboard navigation for image modal
  useEffect(() => {
    if (!showImageModal) return
    const onKey = (e) => {
      if (e.key === 'Escape') setShowImageModal(false)
      if (e.key === 'ArrowRight') setSelectedImage(i => Math.min(images.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setSelectedImage(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showImageModal, images.length])

  const showNotice = (msg) => {
    setValidationMessage(msg)
    setShowValidationPopup(true)
  }

  const handleAddToCart = async () => {
    if (!isUserAuthenticated()) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    if (hasSizes && !selectedSize) {
      showNotice('Please select a size')
      return
    }
    if (outOfStock || (hasSizes && selectedSizeStock <= 0)) {
      showNotice('This item is out of stock')
      return
    }
    const payload = {
      productId: product?.id || product?._id,
      size: selectedSize || undefined,
      quantity: Number(quantity || 1)
    }
    setIsAddingToCart(true)
    try {
      await dispatch(addToCart(payload)).unwrap()
      toast.success('Added to cart')
    } catch (err) {
      console.error('Add to cart failed', err)
      toast.error(String(err?.message || err || 'Failed to add to cart'))
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!isUserAuthenticated()) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    if (hasSizes && !selectedSize) {
      showNotice('Please select a size before buying.')
      return
    }
    if (outOfStock || (hasSizes && selectedSizeStock <= 0)) {
      showNotice('This item is out of stock.')
      return
    }

    // If pincode not verified, try to auto-verify if user entered a 6-digit pincode
    if (!isPincodeVerified) {
      if (pincode && pincode.length === 6) {
        await checkPincode(pincode)
      }
      if (!isPincodeVerified) {
        showNotice('Please verify delivery pincode first.')
        return
      }
    }

    if (!product) {
      showNotice('Product data not loaded yet. Please try again.')
      return
    }

    const qty = Number(quantity || 1)
    const payload = {
      productId: product?.id || product?._id,
      size: selectedSize || undefined,
      quantity: qty
    }

    setIsAddingToCart(true)
    try {
      // add to cart first (backend expects productId,size,quantity)
      await dispatch(addToCart(payload)).unwrap()

      // build order item and go to checkout
      const orderItem = {
        productId: payload.productId,
        name: product?.name || '',
        price: salePrice,
        quantity: qty,
        image: images[0] || null,
        size: payload.size
      }

      navigate('/checkout', { state: { items: [orderItem], total: salePrice * qty, isBuyNow: true } })
    } catch (err) {
      console.error('Buy Now failed:', err)
      showNotice(err?.toString() || 'Failed to process Buy Now. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const toggleWishlist = async (e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!isUserAuthenticated()) {
      toast.info('Please login to manage your wishlist')
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    try {
      if (isWishlisted) {
        await dispatch(removeFromWishlist({ productId: product.id || product._id })).unwrap()
        toast.success('Removed from wishlist')
      } else {
        const data = {
          productId: product.id || product._id,
          name: product.name,
          price: salePrice,
          image: product.image || images[0],
        }
        await dispatch(addToWishlist(data)).unwrap()
        toast.success('Added to wishlist')
      }
    } catch (err) {
      console.error('wishlist error', err)
      toast.error('Wishlist update failed')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name || 'Check this out', url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      }
    } catch {
      /* user dismissed share sheet */
    }
  }

  useEffect(() => {
    if (!product) {
      setSizeMap({})
      return
    }
    const sq = product.sizeQuantity || product.sizeQuantities || product.size_qty || product.sizeQty || null
    let map = {}
    if (!sq) {
      if (Array.isArray(product.sizes) && product.sizes.length) {
        map = Object.fromEntries(product.sizes.map(s => [String(s), Number(product.quantity || 0)]))
      }
    } else if (Array.isArray(sq)) {
      map = sq.reduce((acc, it) => {
        const key = String(it.size || it.label || it.name || '')
        if (!key) return acc
        acc[key] = Number(it.quantity ?? it.qty ?? it.count ?? 0)
        return acc
      }, {})
    } else if (typeof sq === 'object') {
      map = Object.fromEntries(Object.entries(sq).map(([k, v]) => [String(k), Number(v ?? 0)]))
    }
    setSizeMap(map)
    // auto-select first in-stock size
    const first = Object.keys(map).find(k => (Number(map[k]) || 0) > 0) || Object.keys(map)[0] || ''
    setSelectedSize(first)
  }, [product])

  // render star rating
  const renderStars = (rating = 0, size = 'w-4 h-4') => {
    const stars = []
    const full = Math.floor(rating)
    const half = rating - full >= 0.5
    const starPath = "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.184c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.388-2.46a1 1 0 00-1.176 0l-3.388 2.46c-.785.57-1.84-.197-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.04 9.393c-.783-.57-.38-1.81.588-1.81h4.184a1 1 0 00.95-.69L9.049 2.927z"
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<svg key={i} className={`${size} text-yellow-400`} viewBox="0 0 20 20" fill="currentColor"><path d={starPath} /></svg>)
      } else if (i === full && half) {
        stars.push(
          <svg key={i} className={`${size} text-yellow-400`} viewBox="0 0 20 20" fill="currentColor">
            <defs><linearGradient id={`half-${i}`}><stop offset="50%" stopColor="currentColor"/><stop offset="50%" stopColor="transparent"/></linearGradient></defs>
            <path fill={`url(#half-${i})`} d={starPath} />
          </svg>
        )
      } else {
        stars.push(<svg key={i} className={`${size} text-gray-300`} viewBox="0 0 20 20" fill="currentColor"><path d={starPath} /></svg>)
      }
    }
    return <div className="flex items-center space-x-1">{stars}</div>
  }

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return ''
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E72744] mx-auto mb-4"></div>
        <p className="text-gray-600">Loading product details...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="space-y-3">
          <button onClick={() => navigate('/collections')} className="w-full bg-[#E72744] text-white py-3 rounded-lg">Browse Collections</button>
          <button onClick={() => window.history.back()} className="w-full bg-gray-100 text-gray-800 py-3 rounded-lg">Go Back</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image lightbox */}
      {showImageModal && images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <button onClick={() => setShowImageModal(false)} aria-label="Close" className="absolute top-4 right-4 text-white z-30 bg-black bg-opacity-40 rounded-full p-2 hover:bg-opacity-60">
            <X className="w-5 h-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.max(0, i - 1)) }}
                disabled={selectedImage === 0}
                aria-label="Previous image"
                className="absolute left-3 sm:left-6 z-30 text-white bg-black bg-opacity-40 hover:bg-opacity-60 disabled:opacity-30 rounded-full p-2"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.min(images.length - 1, i + 1)) }}
                disabled={selectedImage === images.length - 1}
                aria-label="Next image"
                className="absolute right-3 sm:right-6 z-30 text-white bg-black bg-opacity-40 hover:bg-opacity-60 disabled:opacity-30 rounded-full p-2"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative w-full max-w-3xl flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[selectedImage]}
              alt={product?.name}
              className="max-h-[78vh] w-auto max-w-full object-contain object-center rounded-md shadow-lg"
            />
            <span className="text-white/80 text-sm">{selectedImage + 1} / {images.length}</span>
          </div>
        </div>
      )}

      {showValidationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium mb-2">Notice</h3>
            <p className="text-sm text-gray-600 mb-4">{validationMessage}</p>
            <div className="flex justify-end"><button onClick={() => setShowValidationPopup(false)} className="bg-[#E72744] text-white px-4 py-2 rounded">OK</button></div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">Home</button>
            <span className="text-gray-400">/</span>
            <button onClick={() => navigate('/collections')} className="text-gray-500 hover:text-gray-700">Collections</button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">{product?.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* ===== Left: gallery ===== */}
          <div className="space-y-4">
            <div className="w-full bg-white rounded-lg border border-gray-200 relative flex items-center justify-center">
              <div className="w-full max-w-[720px] p-2">
                {images.length > 0 ? (
                  <div className="rounded-lg overflow-hidden bg-gray-50 relative group">
                    <img
                      src={images[selectedImage] || PLACEHOLDER_IMG}
                      alt={product?.name || 'Product image'}
                      className="w-full h-auto object-cover object-center cursor-zoom-in"
                      onClick={() => setShowImageModal(true)}
                      onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG }}
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                          disabled={selectedImage === 0}
                          aria-label="Previous image"
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow rounded-full p-1.5 disabled:opacity-30"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setSelectedImage(i => Math.min(images.length - 1, i + 1))}
                          disabled={selectedImage === images.length - 1}
                          aria-label="Next image"
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow rounded-full p-1.5 disabled:opacity-30"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                    <img src={PLACEHOLDER_IMG} alt="No image" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="absolute top-3 right-3 flex space-x-2 z-20">
                <button onClick={handleShare} aria-label="Share product" title="Share" className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-50">
                  <Share2 className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={() => setShowImageModal(true)} aria-label="Zoom image" title="Zoom" className="bg-white p-2 rounded-full shadow-sm hover:bg-gray-50">
                  <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>
              </div>
              {outOfStock && (
                <span className="absolute top-3 left-3 z-20 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
              )}
            </div>

            {images.length > 1 && (
              <div className="w-full overflow-x-auto pb-2 mt-2">
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 flex-nowrap px-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-none w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-md overflow-hidden border-2 ${selectedImage === index ? 'border-[#E72744]' : 'border-gray-200'}`}
                        aria-label={`Select image ${index + 1}`}
                        type="button"
                      >
                        <img
                          src={image}
                          alt={`${product?.name} ${index + 1}`}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Show similar products below image on small screens */}
            <div className="block md:hidden mt-3">
              <SmilarProduct
                productCode={product?.productCode ?? product?.code ?? product?.sku}
                subcategory={product?.subCategory ?? product?.subcategory}
                excludeId={product?.id || product?._id}
                limit={5}
              />
            </div>
          </div>

          {/* ===== Right: details ===== */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap gap-2">
              {(product?.bestSeller ?? product?.bestseller) && (
                <span className="bg-black text-white text-xs px-3 py-1 rounded-full">Bestseller</span>
              )}
              {product?.discount > 0 && (
                <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">{product.discount}% OFF</span>
              )}
              {!outOfStock && (
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">In Stock</span>
              )}
              {!outOfStock && totalStock != null && totalStock > 0 && totalStock <= 5 && (
                <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">Only {totalStock} left</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product?.name}</h1>

            {/* Rating summary */}
            <div className="flex items-center space-x-2">
              {renderStars(avgRating)}
              <span className="text-sm text-gray-600">
                {avgRating > 0 ? `${avgRating.toFixed(1)}` : 'No ratings'} ({reviews.length} review{reviews.length === 1 ? '' : 's'})
              </span>
            </div>

            {/* Price block */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">{formatINR(salePrice)}</span>
                {savings > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatINR(product.price)}</span>
                    <span className="text-sm font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                      {product.discount}% OFF
                    </span>
                  </>
                )}
              </div>
              {savings > 0 && (
                <p className="text-sm text-green-700">You save {formatINR(savings)}</p>
              )}
              <p className="text-xs text-gray-400">Inclusive of all taxes</p>
            </div>

            {/* Sizes */}
            {hasSizes && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">Select Size</span>
                  {selectedSize && (
                    <span className="text-xs text-gray-500">
                      {selectedSizeStock > 0 ? `${selectedSizeStock} available` : 'Out of stock'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(sizeMap).map(([size, qty]) => {
                    const disabled = Number(qty) <= 0
                    const active = selectedSize === size
                    return (
                      <button
                        key={size}
                        onClick={() => { if (!disabled) setSelectedSize(size) }}
                        disabled={disabled}
                        className={`relative min-w-[44px] px-3 py-1.5 border rounded-md text-sm transition ${
                          disabled
                            ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed bg-gray-50'
                            : active
                            ? 'bg-[#E72744] text-white border-[#E72744]'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                        title={disabled ? `${size} — Out of stock` : `${size} — ${qty} available`}
                      >
                        <span className="font-medium">{size}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="px-3 py-1.5 w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  disabled={outOfStock || quantity >= maxQty}
                  className="px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              {maxQty > 0 && maxQty !== 10 && <span className="text-xs text-gray-500">Max: {maxQty}</span>}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAddingToCart || outOfStock}
                className="flex-1 px-6 py-3 rounded-lg bg-[#E72744] text-white font-medium hover:bg-[#C81E38] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isAddingToCart || outOfStock}
                className="flex-1 px-6 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingToCart ? 'Processing...' : 'Buy Now'}
              </button>
              <button
                type="button"
                onClick={toggleWishlist}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`px-4 py-3 border rounded-lg flex items-center justify-center gap-2 transition ${
                  isWishlisted
                    ? 'border-[#E72744] text-[#E72744] bg-[#FFF1F3]'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                <span className="sm:hidden">{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-[#FFF1F3] border border-[#FFE0E5] rounded-lg px-3 py-2.5">
                <RefreshCw className="w-5 h-5 text-[#E72744] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-tight">2 Days Replacement</p>
                  <p className="text-[11px] text-gray-500">From date of delivery</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#FFF1F3] border border-[#FFE0E5] rounded-lg px-3 py-2.5">
                <Truck className="w-5 h-5 text-[#E72744] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-tight">Free Shipping</p>
                  <p className="text-[11px] text-gray-500">On orders over ₹999</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#FFF1F3] border border-[#FFE0E5] rounded-lg px-3 py-2.5">
                <ShieldCheck className="w-5 h-5 text-[#E72744] flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-tight">Secure Payment</p>
                  <p className="text-[11px] text-gray-500">Razorpay protected</p>
                </div>
              </div>
            </div>

            {/* Pincode checker */}
            <div className="mt-2 border border-gray-200 rounded-lg p-4 bg-white">
              <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Check Delivery Availability
              </h3>
              <input
                type="text"
                inputMode="numeric"
                value={pincode}
                onChange={handlePincodeChange}
                placeholder="Enter 6-digit pincode"
                className="w-full pl-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E72744]"
                maxLength={6}
              />
              {pincodeStatus === 'checking' && <div className="mt-2 text-sm text-gray-600">Checking delivery availability...</div>}
              {pincodeSource === 'address' && pincode.length === 6 && (
                <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Auto-detected from your saved address
                </div>
              )}
              {pincodeSource === 'saved' && pincode.length === 6 && (
                <div className="mt-1.5 text-xs text-gray-400">Using your last checked location</div>
              )}
              {pincodeStatus === 'available' && deliveryInfo && (
                <div className="mt-2 text-sm text-green-600">
                  Delivery available — estimated {deliveryInfo.estimatedDelivery}
                  {deliveryInfo.codAvailable && ' • COD available'}
                </div>
              )}
              {pincodeStatus === 'unavailable' && <div className="mt-2 text-sm text-red-600">Delivery not available to this location</div>}
              {pincodeStatus === 'invalid' && pincode.length > 0 && <div className="mt-2 text-sm text-[#E72744]">Enter a valid 6-digit pincode</div>}
            </div>

            {/* Product information — everything about the product */}
            {infoItems.length > 0 && (
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Product Information</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {infoItems.map(item => (
                    <div key={item.label} className="flex justify-between sm:block border-b border-dashed border-gray-100 pb-1.5">
                      <dt className="text-gray-500">{item.label}</dt>
                      <dd className="font-medium text-gray-800 capitalize truncate">{item.value}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between sm:block border-b border-dashed border-gray-100 pb-1.5">
                    <dt className="text-gray-500">Listed On</dt>
                    <dd className="font-medium text-gray-800">{formatDate(product?.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            )}

            {/* Tabs: Description | Reviews */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex space-x-6 border-b border-gray-200">
                <button onClick={() => setActiveTab('description')} className={`pb-3 px-1 text-sm font-medium ${activeTab === 'description' ? 'text-[#E72744] border-b-2 border-[#E72744]' : 'text-gray-500 hover:text-gray-700'}`}>Description</button>
                <button onClick={() => setActiveTab('reviews')} className={`pb-3 px-1 text-sm font-medium ${activeTab === 'reviews' ? 'text-[#E72744] border-b-2 border-[#E72744]' : 'text-gray-500 hover:text-gray-700'}`}>Reviews ({reviews.length})</button>
              </div>

              <div className="py-4">
                {activeTab === 'description' && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {product?.description || 'No description available for this product.'}
                  </p>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Summary */}
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-lg p-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                          <div className="mt-1">{renderStars(avgRating, 'w-3.5 h-3.5')}</div>
                          <p className="text-xs text-gray-500 mt-1">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                    )}

                    {reviews.length === 0 && (
                      <p className="text-gray-500">No reviews yet. Be the first to review this product.</p>
                    )}

                    {reviews.map((r, i) => {
                      const rating = Number(r?.rating) || 0
                      return (
                        <div key={i} className="border-b border-gray-100 pb-4 last:border-b-0">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              {renderStars(rating, 'w-3.5 h-3.5')}
                              <span className="text-sm font-medium text-gray-900">
                                {r?.name || r?.user?.name || r?.user || 'Customer'}
                              </span>
                            </div>
                            {(r?.date || r?.createdAt) && (
                              <span className="text-xs text-gray-400">{formatDate(r.date || r.createdAt)}</span>
                            )}
                          </div>
                          {r?.title && <p className="text-sm font-semibold text-gray-800 mt-1.5">{r.title}</p>}
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                            {typeof r === 'string' ? r : (r?.comment || r?.review || '')}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Return policy link */}
            <Link
              to="/return-exchange-policy"
              className="flex items-center justify-between gap-3 bg-[#FFF1F3] border border-[#FFE0E5] rounded-lg px-4 py-3 group"
            >
              <div className="flex items-center gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#E72744] text-white">
                  <RefreshCw className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight">2 Days Replacement Only</p>
                  <p className="text-xs text-gray-500">Request a replacement within 2 days of delivery.</p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#E72744] group-hover:text-[#C81E38] whitespace-nowrap">View policy</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Similar + related products */}
      {product && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6">
          {/* similar products for md+ (mobile shows them under the image) */}
          <div className="hidden md:block">
            <SmilarProduct
              productCode={product?.productCode ?? product?.code ?? product?.sku}
              subcategory={product?.subCategory ?? product?.subcategory}
              excludeId={product?.id || product?._id}
              limit={5}
            />
          </div>
          <RelatedProduct category={product.category} subcategory={product.subCategory || product.subcategory} />
        </div>
      )}
    </div>
  )
}

export default ProductDetails
