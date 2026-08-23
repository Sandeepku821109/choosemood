import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Truck,
  Edit,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Star,
  Home,
  Building,
  User,
  Mail,
  CheckCircle,
  Info,
  Sparkles,
  Gift,
  Heart,
  Zap,
  Wallet
} from 'lucide-react'
import axios from 'axios'
import { backendUrl } from '../../App'
import {
  fetchAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setSelectedAddress as setReduxSelectedAddress,
  clearError
} from '../../store/slices/addressSlice'
import {
  cashOnDelivery,
  clearPaymentState,
  clearError as clearPaymentError
} from '../../store/slices/paymentSlice'
import { validateSpinCoupon, fetchWallet, fetchSpinStatus } from '../../store/slices/walletSlice'
import { clearCart } from '../../store/slices/cartSlice'
import { handleImageError, processImageUrl } from '../../utils/imageUtils'

const Checkout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Redux state for addresses
  const { addresses: reduxAddresses, loading: addressLoading, error: addressError, selectedAddress: reduxSelectedAddress } = useSelector(state => state.address)
  
  // Redux state for payments
  const { error: paymentError, success: paymentSuccess, completedOrder } = useSelector(state => state.payment)

  // Wallet balance for discount at checkout
  const walletBalance = useSelector(state => state.wallet?.balance || 0)

  // Active free-delivery coupons won from the spin game (cash prizes excluded)
  const rawSpinRewards = useSelector(state => state.wallet?.spin?.activeRewards)
  const activeCoupons = useMemo(
    () => (rawSpinRewards || []).filter(r => r?.type === 'FREE_DELIVERY'),
    [rawSpinRewards]
  )

  // State management
  const [checkoutData, setCheckoutData] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [formErrors, setFormErrors] = useState({})
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    city: '',
    pincode: '',
    landmark: '',
    isDefault: false,
    email: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [, setCompletedOrder] = useState(null)
  const [couponInput, setCouponInput] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [appliedCouponCode, setAppliedCouponCode] = useState('')
  const [couponChecking, setCouponChecking] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [discountCoupon, setDiscountCoupon] = useState(null)
  const [discountChecking, setDiscountChecking] = useState(false)
  const [discountMsg, setDiscountMsg] = useState(null)
  const [useWalletBalance, setUseWalletBalance] = useState(false)
  const [couponOptIn, setCouponOptIn] = useState(true)
  const [autoApplyAttempted, setAutoApplyAttempted] = useState('')

  // Get user data from localStorage
  const userData = {
    name: localStorage.getItem('userName') || '',
    email: localStorage.getItem('userEmail') || '',
    phone: localStorage.getItem('userPhone') || '',
    userId: localStorage.getItem('userId') || ''
  }

  // Load checkout data and addresses on component mount
  useEffect(() => {
    const storedCheckoutData = localStorage.getItem('checkoutData')
    if (storedCheckoutData) {
      const data = JSON.parse(storedCheckoutData)
      setCheckoutData(data)
      setPaymentMethod(data.paymentMethod || 'cod')
    } else {
      navigate('/cart')
      return
    }

    // Fetch addresses from Redux store
    dispatch(fetchAddress())

    // Fetch wallet balance for checkout discount
    dispatch(fetchWallet())

    // Fetch active free-delivery coupons for auto-apply
    dispatch(fetchSpinStatus())

    // Clear any previous payment state
    dispatch(clearPaymentState())
  }, [navigate, dispatch])

  // Update local addresses when Redux addresses change
  useEffect(() => {
    if (reduxAddresses && reduxAddresses.length > 0) {
      setAddresses(reduxAddresses)
      // Auto-select default address if none selected
      if (!selectedAddress) {
        const defaultAddr = reduxAddresses.find(addr => addr.isDefault)
        if (defaultAddr) {
          setSelectedAddress(defaultAddr)
          dispatch(setReduxSelectedAddress(defaultAddr))
        }
      }
    }
  }, [reduxAddresses])

  // Update selected address when it changes in Redux
  useEffect(() => {
    if (reduxSelectedAddress && reduxSelectedAddress._id !== selectedAddress?._id) {
      console.log('🔄 Syncing with Redux selected address:', reduxSelectedAddress)
      setSelectedAddress(reduxSelectedAddress)
    }
  }, [reduxSelectedAddress, selectedAddress])

  // Handle payment success
  useEffect(() => {
    if (paymentSuccess && completedOrder) {
      localStorage.removeItem('checkoutData')
      setShowSuccessAnimation(true)
      setTimeout(() => {
        navigate(`/order-success/${completedOrder._id}`)
      }, 2000)
    }
  }, [paymentSuccess, completedOrder, navigate])

  // Add error handling for address operations
  useEffect(() => {
    if (addressError) {
      setMessage({ type: 'error', text: addressError })
      setTimeout(() => {
        dispatch(clearError())
        setMessage({ type: '', text: '' })
      }, 5000)
    }
  }, [addressError, dispatch])

  // Add error handling for payment operations
  useEffect(() => {
    if (paymentError) {
      setMessage({ type: 'error', text: paymentError })
      setTimeout(() => {
        dispatch(clearPaymentError())
        setMessage({ type: '', text: '' })
      }, 5000)
    }
  }, [paymentError, dispatch])

  // Add this debugging code before calling Razorpay
  useEffect(() => {
    if (checkoutData) {
      console.log('🔍 Checkout Data Debug:', {
        subtotal: checkoutData.subtotal,
        shipping: checkoutData.shipping,
        total: checkoutData.total,
        totalType: typeof checkoutData.total,
        items: checkoutData.items?.length || 0
      })
      
      // Verify total calculation
      const calculatedTotal = (parseFloat(checkoutData.subtotal) || 0) + (parseFloat(checkoutData.shipping) || 0)
      console.log('🔍 Calculated total:', calculatedTotal)
      console.log('🔍 Stored total:', checkoutData.total)
      
      if (Math.abs(calculatedTotal - parseFloat(checkoutData.total)) > 0.01) {
        console.warn('⚠️ Total amount mismatch detected!')
      }
    }
  }, [checkoutData])

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Validation functions
  const validateAddress = (address) => {
    const errors = {}
    
    if (!address.fullName?.trim()) {
      errors.fullName = 'Full name is required'
    } else if (address.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters'
    }
    
    if (!address.phoneNumber?.trim()) {
      errors.phoneNumber = 'Phone number is required'
    } else if (!/^\d{10}$/.test(address.phoneNumber.trim())) {
      errors.phoneNumber = 'Phone number must be exactly 10 digits'
    }
    
    if (!address.addressLine1?.trim()) {
      errors.addressLine1 = 'Address line 1 is required'
    } else if (address.addressLine1.trim().length < 5) {
      errors.addressLine1 = 'Address must be at least 5 characters'
    }
    
    if (!address.city?.trim()) {
      errors.city = 'City is required'
    } else if (address.city.trim().length < 2) {
      errors.city = 'City must be at least 2 characters'
    }
    
    if (!address.pincode?.trim()) {
      errors.pincode = 'Pincode is required'
    } else if (!/^\d{6}$/.test(address.pincode.trim())) {
      errors.pincode = 'Pincode must be exactly 6 digits'
    }
    
    if (address.email && address.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(address.email.trim())) {
        errors.email = 'Please enter a valid email address'
      }
    }
    
    return errors
  }

  const handleTextInputChange = (field, value, setter, errors, setErrors) => {
    const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '')
    setter(prev => ({ ...prev, [field]: sanitizedValue }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePhoneNumberChange = (e, setter, errors, setErrors) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 10) {
      setter(prev => ({ ...prev, phoneNumber: value }))
      if (errors.phoneNumber) {
        setErrors(prev => ({ ...prev, phoneNumber: '' }))
      }
    }
  }

  const handlePincodeChange = (e, setter, errors, setErrors) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 6) {
      setter(prev => ({ ...prev, pincode: value }))
      if (errors.pincode) {
        setErrors(prev => ({ ...prev, pincode: '' }))
      }
    }
  }

  const handleAddressInputChange = (field, value, setter, errors, setErrors) => {
    setter(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleEmailInputChange = (e, setter, errors, setErrors) => {
    const value = e.target.value
    setter(prev => ({ ...prev, email: value }))
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }))
    }
  }

  // Enhanced renderSuccessAnimation function
  const renderSuccessAnimation = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Confetti Animation */}
          {[...Array(20)].map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              <div 
                className={`w-2 h-2 rounded-full ${
                  ['bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 5)]
                }`}
              ></div>
            </div>
          ))}
          
          {/* Floating Hearts */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`heart-${i}`}
              className="absolute animate-pulse text-red-400"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            >
              ❤️
            </div>
          ))}
        </div>

        {/* Success Icon with Pulsing Animation */}
        <div className="flex justify-center mb-6 relative">
          <div className="bg-green-100 rounded-full p-6 animate-success-pulse">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          
          {/* Sparkle effects around the icon */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-sparkle"
              style={{
                left: `${50 + Math.cos(i * Math.PI / 4) * 60}%`,
                top: `${50 + Math.sin(i * Math.PI / 4) * 60}%`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>

        {/* Success Message */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Order Placed Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for your purchase! Your order has been confirmed.
          </p>
          
          {completedOrder && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 animate-fade-in-delay">
              <p className="text-sm text-gray-700">
                <strong>Order ID:</strong> #{completedOrder._id?.slice(-8) || 'N/A'}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Total:</strong> ₹{completedOrder.total?.toFixed(2) || '0.00'}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 animate-fade-in-delay">
          <div className="bg-green-500 h-2 rounded-full animate-loading-bar"></div>
        </div>

        {/* Celebration Message */}
        <div className="animate-fade-in-delay-2">
          <p className="text-sm text-gray-500 mb-4">
            🚀 Redirecting to your orders...
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => {
                setShowSuccessAnimation(false)
                navigate('/orders', { replace: true })
              }}
              className="w-full bg-[#E72744] text-white py-2 px-4 rounded-lg hover:bg-[#C81E38] transition-colors"
            >
              View My Orders
            </button>
            <button
              onClick={() => {
                setShowSuccessAnimation(false)
                navigate('/products', { replace: true })
              }}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Update the handlePlaceOrder function for Razorpay payment
  const applyCouponCode = async (code) => {
    if (!code) return false
    setCouponChecking(true)
    try {
      const result = await dispatch(validateSpinCoupon(code)).unwrap()
      if (result?.success) {
        setCouponApplied(true)
        setAppliedCouponCode(code)
        setMessage({ type: 'success', text: result.message || 'Free delivery coupon applied!' })
        return true
      } else {
        setMessage({ type: 'error', text: result?.message || 'Invalid or expired coupon' })
        return false
      }
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Invalid or expired coupon' })
      return false
    } finally {
      setCouponChecking(false)
    }
  }

  const applyFreeDeliveryCoupon = async () => {
    await applyCouponCode(couponInput.trim())
  }

  // Auto-apply the first available free-delivery coupon (checked by default)
  useEffect(() => {
    const available = activeCoupons[0]
    if (available?.code && couponOptIn && !couponApplied && !couponChecking && autoApplyAttempted !== available.code) {
      setAutoApplyAttempted(available.code)
      applyCouponCode(available.code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCoupons, couponOptIn, couponApplied])

  const handleFreeDeliveryToggle = (e) => {
    const checked = e.target.checked
    setCouponOptIn(checked)
    if (checked) {
      const available = activeCoupons[0]
      if (available?.code) {
        setAutoApplyAttempted(available.code)
        applyCouponCode(available.code)
      }
    } else {
      removeCoupon()
    }
  }

  const removeCoupon = () => {
    setCouponApplied(false)
    setAppliedCouponCode('')
    setCouponInput('')
    setMessage({ type: '', text: '' })
  }

  // Discount coupon (created by admin) — validates against cart subtotal
  const applyDiscountCoupon = async () => {
    if (!discountInput.trim()) return
    setDiscountChecking(true)
    try {
      const cartTotal = parseFloat(checkoutData.subtotal) || 0
      const resp = await axios.get(
        `${backendUrl}/api/payments/coupons/validate/${discountInput.trim().toUpperCase()}?cartTotal=${cartTotal}`,
        { headers: getAuthHeaders() }
      )
      if (resp.data?.success && resp.data?.data?.coupon) {
        setDiscountCoupon(resp.data.data.coupon)
        setDiscountMsg({ type: 'success', text: `Coupon applied — you save ₹${resp.data.data.coupon.discountAmount}` })
      } else {
        setDiscountMsg({ type: 'error', text: resp.data?.message || 'Invalid or expired coupon' })
      }
    } catch (error) {
      const serverMsg = error.response?.data?.message
      setDiscountMsg({ type: 'error', text: serverMsg || 'Invalid or expired coupon code' })
    } finally {
      setDiscountChecking(false)
    }
  }

  const removeDiscountCoupon = () => {
    setDiscountCoupon(null)
    setDiscountInput('')
    setDiscountMsg(null)
  }

  const couponDiscountAmount = discountCoupon ? (discountCoupon.discountAmount || 0) : 0
  const freeDeliveryActive = couponApplied
  // Mirror backend calculateOrderTotals: subtotal - coupon + shipping, wallet applied last
  const baseTotal =
    (parseFloat(checkoutData?.subtotal) || 0) -
    couponDiscountAmount +
    (freeDeliveryActive ? 0 : parseFloat(checkoutData?.shipping) || 0)
  const walletAppliedAmount = useWalletBalance
    ? Math.min(walletBalance, Math.max(baseTotal, 0))
    : 0
  const payableTotal = baseTotal - walletAppliedAmount

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setMessage({ type: 'error', text: 'Please select a delivery address' })
      return
    }

    if (!paymentMethod) {
      setMessage({ type: 'error', text: 'Please select a payment method' })
      return
    }

    setIsPlacingOrder(true)
    setMessage({ type: '', text: '' })

    try {
      const orderData = {
        items: checkoutData.items,
        shippingAddress: selectedAddress,
        paymentMethod: paymentMethod,
        couponCode: discountCoupon?.code || '',
        useWalletBalance: walletAppliedAmount > 0,
        subtotal: checkoutData.subtotal,
        shipping: freeDeliveryActive ? 0 : checkoutData.shipping,
        total: payableTotal,
        freeDeliveryCode: freeDeliveryActive ? appliedCouponCode : ''
      }

      // Debug the order data
      console.log('🛒 Order Data:', {
        total: orderData.total,
        totalType: typeof orderData.total,
        totalParsed: parseFloat(orderData.total),
        subtotal: orderData.subtotal,
        shipping: orderData.shipping
      })

      if (paymentMethod === 'cod') {
        // Handle COD orders
        const result = await dispatch(cashOnDelivery(orderData)).unwrap()
        
        if (result) {
          console.log('✅ COD Order created successfully:', result)
          setCompletedOrder(result.order || result)
          localStorage.removeItem('checkoutData')
          dispatch(clearCart())
          setShowSuccessAnimation(true)
          
          setTimeout(() => {
            setShowSuccessAnimation(false)
            navigate('/orders', { replace: true })
          }, 4000)
        }
      } else if (paymentMethod === 'razorpay') {
        // Handle Razorpay orders
        const { initializeRazorpayPayment } = await import('../../utils/razorpayService')
        
        // Prepare order details for Razorpay
        const orderDetails = {
          total: payableTotal,
          items: checkoutData.items,
          orderId: `order_${Date.now()}`,
          addressId: selectedAddress._id,
          userId: userData.userId,
          couponCode: discountCoupon?.code || '',
          useWalletBalance: walletAppliedAmount > 0,
          subtotal: parseFloat(checkoutData.subtotal),
          shipping: freeDeliveryActive ? 0 : checkoutData.shipping,
          freeDeliveryCode: freeDeliveryActive ? appliedCouponCode : '',
          paymentMethod: 'razorpay'
        }
        
        const userDetails = {
          userId: userData.userId,
          name: userData.name || selectedAddress.fullName,
          email: userData.email || selectedAddress.email,
          phone: userData.phone || selectedAddress.phoneNumber,
          fullName: selectedAddress.fullName,
          phoneNumber: selectedAddress.phoneNumber
        }
        
        console.log('🎯 Initiating Razorpay payment with:', {
          orderTotal: orderDetails.total,
          orderDetails,
          userDetails
        })
        
        // Initialize Razorpay payment
        await initializeRazorpayPayment(
          orderDetails,
          userDetails,
          // Success callback
          (result) => {
            console.log('✅ Razorpay payment successful:', result)
            setCompletedOrder(result.order || result)
            localStorage.removeItem('checkoutData')
            dispatch(clearCart())
            setShowSuccessAnimation(true)
            setIsPlacingOrder(false)
            
            setTimeout(() => {
              setShowSuccessAnimation(false)
              navigate('/orders', { replace: true })
            }, 4000)
          },
          // Failure callback
          (error) => {
            console.error('❌ Razorpay payment failed:', error)
            setMessage({ type: 'error', text: error || 'Payment failed. Please try again.' })
            setIsPlacingOrder(false)
          }
        )
      }
    } catch (error) {
      console.error('❌ Order placement failed:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || error || 'Failed to place order. Please try again.' 
      })
      setIsPlacingOrder(false)
    }
  }

  // Render address form
  const renderAddressForm = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingAddress ? 'Edit Address' : 'Add New Address'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            value={newAddress.fullName}
            onChange={(e) => handleTextInputChange('fullName', e.target.value, setNewAddress, formErrors, setFormErrors)}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.fullName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter full name"
          />
          {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            type="tel"
            value={newAddress.phoneNumber}
            onChange={(e) => handlePhoneNumberChange(e, setNewAddress, formErrors, setFormErrors)}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter phone number"
          />
          {formErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            value={newAddress.email}
            onChange={(e) => handleEmailInputChange(e, setNewAddress, formErrors, setFormErrors)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter email address"
          />
          {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
          <input
            type="text"
            value={newAddress.addressLine1}
            onChange={(e) => handleAddressInputChange('addressLine1', e.target.value, setNewAddress, formErrors, setFormErrors)}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.addressLine1 ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Street address"
          />
          {formErrors.addressLine1 && <p className="text-red-500 text-xs mt-1">{formErrors.addressLine1}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input
            type="text"
            value={newAddress.city}
            onChange={(e) => handleAddressInputChange('city', e.target.value, setNewAddress, formErrors, setFormErrors)}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.city ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="City"
          />
          {formErrors.city && <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
          <input
            type="text"
            value={newAddress.pincode}
            onChange={(e) => handlePincodeChange(e, setNewAddress, formErrors, setFormErrors)}
            className={`w-full px-3 py-2 border rounded-md ${formErrors.pincode ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="6-digit pincode"
          />
          {formErrors.pincode && <p className="text-red-500 text-xs mt-1">{formErrors.pincode}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
          <input
            type="text"
            value={newAddress.landmark}
            onChange={(e) => handleAddressInputChange('landmark', e.target.value, setNewAddress, formErrors, setFormErrors)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Nearby landmark"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefault"
            checked={newAddress.isDefault}
            onChange={(e) => handleAddressInputChange('isDefault', e.target.checked, setNewAddress, formErrors, setFormErrors)}
            className="mr-2"
          />
          <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={() => {
            setShowAddressForm(false)
            setEditingAddress(null)
            resetAddressForm()
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleAddAddress}
          className="px-4 py-2 bg-[#E72744] text-white rounded-md hover:bg-[#C81E38]"
        >
          {editingAddress ? 'Update Address' : 'Save Address'}
        </button>
      </div>
    </div>
  )

  // Handle address operations
  const handleAddAddress = async () => {
    const errors = validateAddress(newAddress)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      setMessage({ type: 'error', text: 'Please fix the errors in the form' })
      return
    }

    try {
      let result
      if (editingAddress) {
        result = await dispatch(updateAddress({ ...newAddress, _id: editingAddress._id })).unwrap()
        setMessage({ type: 'success', text: 'Address updated successfully!' })
      } else {
        result = await dispatch(createAddress(newAddress)).unwrap()
        setMessage({ type: 'success', text: 'Address added successfully!' })
      }

      await dispatch(fetchAddress()).unwrap()
      
      if (result) {
        setSelectedAddress(result)
        dispatch(setReduxSelectedAddress(result))
      }

      setShowAddressForm(false)
      setEditingAddress(null)
      resetAddressForm()
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Address operation failed:', error)
      setMessage({ type: 'error', text: error || 'Failed to save address' })
    }
  }

  const resetAddressForm = () => {
    setNewAddress({
      fullName: userData.name || '',
      phoneNumber: userData.phone || '',
      addressLine1: '',
      city: '',
      pincode: '',
      landmark: '',
      isDefault: false,
      email: userData.email || ''
    })
    setFormErrors({})
  }

  const handleAddressSelect = (address) => {
    setSelectedAddress(address)
    dispatch(setReduxSelectedAddress(address))
  }

  const handleEditAddress = (address) => {
    setEditingAddress(address)
    setNewAddress({
      fullName: address.fullName || '',
      phoneNumber: address.phoneNumber || '',
      addressLine1: address.addressLine1 || '',
      city: address.city || '',
      pincode: address.pincode || '',
      landmark: address.landmark || '',
      isDefault: address.isDefault || false,
      email: address.email || ''
    })
    setFormErrors({})
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return
    }

    try {
      await dispatch(deleteAddress(addressId)).unwrap()
      await dispatch(fetchAddress()).unwrap()
      setMessage({ type: 'success', text: 'Address deleted successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Delete address failed:', error)
      setMessage({ type: 'error', text: 'Failed to delete address' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  // Render address list
  const renderAddressList = () => (
    <div className="space-y-4">
      {addresses && addresses.length > 0 ? (
        addresses.map((addr) => (
          <div 
            key={addr._id} 
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedAddress?._id === addr._id 
                ? 'border-[#E72744] bg-[#FFF1F3] shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleAddressSelect(addr)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {/* Radio button and name */}
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    checked={selectedAddress?._id === addr._id}
                    onChange={() => handleAddressSelect(addr)}
                    className="w-4 h-4 text-[#E72744] border-gray-300 focus:ring-[#E72744]"
                  />
                  <span className="font-medium ml-2">{addr.fullName}</span>
                  {addr.isDefault && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      Default
                    </span>
                  )}
                  {selectedAddress?._id === addr._id && (
                    <span className="ml-2 px-2 py-0.5 bg-[#FFE0E5] text-[#AE1830] text-xs rounded-full flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Delivery Address
                    </span>
                  )}
                </div>

                {/* Address details */}
                <div className="ml-6">
                  <p className="text-sm text-gray-600 mb-1">{addr.addressLine1}</p>
                  <p className="text-sm text-gray-600 mb-1">
                    {addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.pincode}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Phone:</span> {addr.phoneNumber}
                  </p>
                  {addr.email && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Email:</span> {addr.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Edit/Delete buttons */}
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditAddress(addr)
                  }}
                  className="p-1.5 text-[#E72744] hover:text-[#C81E38] hover:bg-[#FFF1F3] rounded-full transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAddress(addr._id)
                  }}
                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No addresses found</p>
          <button
            onClick={() => {
              resetAddressForm()
              setShowAddressForm(true)
            }}
            className="mt-2 text-[#E72744] hover:text-[#C81E38]"
          >
            + Add New Address
          </button>
        </div>
      )}
    </div>
  )

  // Render checkout summary
  const renderCheckoutSummary = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

      {/* Product details */}
      {checkoutData?.items?.length > 0 && (
        <div className="mb-5 pb-5 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
            Products ({checkoutData.items.length})
          </h4>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {checkoutData.items.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center gap-3">
                <img
                  src={processImageUrl(item.image, item.name)}
                  onError={(e) => handleImageError(e, item.name)}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg object-cover ring-1 ring-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Qty: {item.quantity} × ₹{(Number(item.price) || 0).toFixed(2)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 shrink-0">
                  ₹{((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free delivery coupon */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        {couponApplied ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 text-emerald-700">
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">Free delivery applied{appliedCouponCode ? ` (${appliedCouponCode})` : ''}</span>
            </div>
            <button
              onClick={() => { removeCoupon(); setCouponOptIn(false) }}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Remove
            </button>
          </div>
        ) : activeCoupons.length > 0 ? (
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={couponOptIn}
              onChange={handleFreeDeliveryToggle}
              disabled={couponChecking}
              className="mt-0.5 w-4 h-4 accent-[#E72744] cursor-pointer"
            />
            <span className="flex-1">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5 flex-wrap">
                <Truck className="w-4 h-4" />
                Use free delivery coupon
                <span className="font-mono font-bold text-[#C81E38] bg-[#FFF1F3] px-2 py-0.5 rounded tracking-wider text-xs">
                  {activeCoupons[0].code}
                </span>
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                Applied automatically — uncheck if you don't want free delivery on this order
              </span>
              {couponChecking && (
                <span className="mt-1.5 text-xs text-gray-500 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying coupon...
                </span>
              )}
            </span>
          </label>
        ) : (
          <>
            <label className="text-sm text-gray-600 font-medium flex items-center gap-1.5 mb-2">
              <Truck className="w-4 h-4" />
              Have a free delivery coupon?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter code e.g. FLYFREE-XXXXXX"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase tracking-wide focus:ring-2 focus:ring-[#E72744] focus:border-transparent outline-none"
              />
              <button
                onClick={applyFreeDeliveryCoupon}
                disabled={couponChecking || !couponInput.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {couponChecking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Apply
              </button>
            </div>
          </>
        )}
        {message.text && !couponApplied && (
          <p className={`mt-2 text-xs flex items-center gap-1 ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            {message.text}
          </p>
        )}
      </div>

      {/* Discount coupon (admin created) */}
      <div className="mb-5 pb-5 border-b border-gray-100">
        {discountCoupon ? (
          <div className="bg-[#FFF1F3] border border-[#FFC6CF] rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#C81E38]">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {discountCoupon.code} applied
                  {discountCoupon.discountType === 'PERCENTAGE'
                    ? ` (${discountCoupon.discountValue}% off)`
                    : ` (₹${discountCoupon.discountValue} off)`}
                </span>
              </div>
              <button
                onClick={removeDiscountCoupon}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Remove
              </button>
            </div>
            {discountMsg && (
              <p className={`text-xs ${discountMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {discountMsg.text}
              </p>
            )}
          </div>
        ) : (
          <>
            <label className="text-sm text-gray-600 font-medium flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4" />
              Have a discount coupon?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountInput}
                onChange={(e) => { setDiscountInput(e.target.value.toUpperCase()); setDiscountMsg(null) }}
                onKeyDown={(e) => e.key === 'Enter' && applyDiscountCoupon()}
                placeholder="Enter code e.g. SUMMER25"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase tracking-wide focus:ring-2 focus:ring-[#E72744] focus:border-transparent outline-none"
              />
              <button
                onClick={applyDiscountCoupon}
                disabled={discountChecking || !discountInput.trim()}
                className="px-4 py-2 bg-[#E72744] text-white rounded-lg text-sm font-medium hover:bg-[#C81E38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {discountChecking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Apply
              </button>
            </div>
            {discountMsg && (
              <p className={`mt-2 text-xs flex items-center gap-1 ${discountMsg.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                <AlertCircle className="w-3.5 h-3.5" />
                {discountMsg.text}
              </p>
            )}
          </>
        )}
      </div>

      {/* Wallet balance discount */}
      {walletBalance > 0 && (
        <div className="mb-5 pb-5 border-b border-gray-100">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={useWalletBalance}
              onChange={(e) => setUseWalletBalance(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="flex-1">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#E72744]" />
                Use wallet balance
                <span className="font-semibold text-[#E72744]">₹{walletBalance.toFixed(2)}</span>
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {useWalletBalance
                  ? `₹${walletAppliedAmount.toFixed(2)} will be deducted from your wallet`
                  : 'Available to spend on this order'}
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>₹{checkoutData?.subtotal.toFixed(2) || '0.00'}</span>
        </div>
        {discountCoupon && couponDiscountAmount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Coupon ({discountCoupon.code})</span>
            <span>-₹{couponDiscountAmount.toFixed(2)}</span>
          </div>
        )}
        {walletAppliedAmount > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Wallet balance</span>
            <span>-₹{walletAppliedAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          {freeDeliveryActive ? (
            <span className="flex items-center gap-2">
              <span className="text-gray-400 line-through">₹{checkoutData?.shipping.toFixed(2) || '0.00'}</span>
              <span className="text-emerald-600 font-medium">FREE</span>
            </span>
          ) : (
            <span>₹{checkoutData?.shipping.toFixed(2) || '0.00'}</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span>₹{(checkoutData?.total - checkoutData?.subtotal - checkoutData?.shipping).toFixed(2) || '0.00'}</span>
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span className={(freeDeliveryActive || couponDiscountAmount > 0 || walletAppliedAmount > 0) ? 'text-emerald-700' : ''}>
            ₹{payableTotal.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-3">Payment Method</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              <span>Cash on Delivery</span>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="payment"
              value="razorpay"
              checked={paymentMethod === 'razorpay'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <div className="flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              <span>Razorpay</span>
            </div>
          </label>
        </div>
      </div>
      
      <button
        onClick={handlePlaceOrder}
        disabled={isPlacingOrder}
        className="w-full bg-[#E72744] text-white py-3 rounded-lg font-medium hover:bg-[#C81E38] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isPlacingOrder ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Placing Order...
          </>
        ) : (
          `Place Order - ₹${payableTotal.toFixed(2) || '0.00'}`
        )}
      </button>
      <p className="mt-3 text-xs text-center text-gray-500">
        2 days replacement only from the date of delivery.{' '}
        <a href="/return-exchange-policy" className="text-[#E72744] hover:underline">View policy</a>
      </p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center text-[#E72744] hover:text-[#C81E38] mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cart
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Address Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Delivery Address</h2>
              <button
                onClick={() => {
                  resetAddressForm()
                  setShowAddressForm(true)
                  setEditingAddress(null)
                }}
                className="flex items-center text-[#E72744] hover:text-[#C81E38]"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Address
              </button>
            </div>
            
            {showAddressForm ? (
              renderAddressForm()
            ) : (
              <div>
                {addressLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  renderAddressList()
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div>
          {renderCheckoutSummary()}
        </div>
      </div>

      {/* Success Animation */}
      {showSuccessAnimation && renderSuccessAnimation()}

      {/* Additional Styles */}
      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes fade-in-delay {
            0% { opacity: 0; transform: translateY(15px) scale(0.95); }
            50% { opacity: 0; transform: translateY(15px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes fade-in-delay-2 {
            0% { opacity: 0; transform: translateY(10px) scale(0.98); }
            70% { opacity: 0; transform: translateY(10px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes slide-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes loading-bar {
            0% { width: 0%; }
            20% { width: 30%; }
            50% { width: 60%; }
            80% { width: 85%; }
            100% { width: 100%; }
          }

          @keyframes celebration-bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }

          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
          }

          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }

          .animate-fade-in-delay {
            animation: fade-in-delay 1.4s ease-out;
          }

          .animate-fade-in-delay-2 {
            animation: fade-in-delay-2 2s ease-out;
          }

          .animate-slide-up {
            animation: slide-up 1s ease-out;
          }

          .animate-loading-bar {
            animation: loading-bar 3.5s ease-out;
          }

          .animate-celebration-bounce {
            animation: celebration-bounce 2s ease-in-out infinite;
          }

          .animate-sparkle {
            animation: sparkle 1.5s ease-in-out infinite;
          }

          /* Pulse animation for success icon */
          @keyframes success-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(72, 187, 120, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(72, 187, 120, 0); }
          }

          .animate-success-pulse {
            animation: success-pulse 2s infinite;
          }
        `}
      </style>
    </div>
  )
}

export default Checkout
