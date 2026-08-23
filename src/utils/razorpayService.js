
import { backendUrl } from '../App'
import axios from 'axios'

// Helper function to get auth headers and user info
const getAuthHeaders = () => {
  const authToken = localStorage.getItem('authToken')
  const token = localStorage.getItem('token')
  const userEmail = localStorage.getItem('userEmail')
  const userId = localStorage.getItem('userId')
  
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  } else if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  if (userEmail) {
    headers['User-Email'] = userEmail
  }
  
  if (userId) {
    headers['User-ID'] = userId
  }
  
  console.log('🔐 Auth headers prepared:', {
    hasAuthorization: !!headers.Authorization,
    hasUserEmail: !!headers['User-Email'],
    hasUserId: !!headers['User-ID'],
    authTokenLength: authToken?.length,
    tokenLength: token?.length
  })
  
  return headers
}

// Enhanced function to check user authentication
const checkUserAuthentication = () => {
  const authToken = localStorage.getItem('authToken')
  const token = localStorage.getItem('token')
  const userId = localStorage.getItem('userId')
  const userEmail = localStorage.getItem('userEmail')

  console.log('🔐 Authentication Check:', {
    hasAuthToken: !!authToken,
    hasToken: !!token,
    hasUserId: !!userId,
    hasUserEmail: !!userEmail,
    authTokenLength: authToken?.length,
    tokenLength: token?.length,
    userIdValue: userId,
    userEmailValue: userEmail
  });

  // Check if we have any valid token (this is the primary requirement)
  const hasValidToken = !!(authToken || token)
  
  // For user identification, we need either userId or userEmail
  const hasUserIdentification = !!(userId || userEmail)

  return {
    isAuthenticated: hasValidToken && hasUserIdentification,
    token: authToken || token,
    userId,
    userEmail,
    hasValidToken,
    hasUserIdentification
  }
}

// Load Razorpay script dynamically
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      console.log('✅ Razorpay script already loaded')
      resolve(true)
      return
    }

    console.log('📜 Loading Razorpay script...')
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully')
      resolve(true)
    }
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script')
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

// Create Razorpay order
export const createRazorpayOrder = async (orderData) => {
  try {
    console.log('🚀 Creating Razorpay order with data:', orderData)
    
    // Enhanced amount validation and parsing
    let totalAmount = 0
    
    if (typeof orderData.total === 'string') {
      // Remove any currency symbols and parse
      totalAmount = parseFloat(orderData.total.replace(/[₹,\s]/g, ''))
    } else if (typeof orderData.total === 'number') {
      totalAmount = orderData.total
    }
    
    console.log('💰 Original total:', orderData.total, '(type:', typeof orderData.total, ')')
    console.log('💰 Parsed total amount:', totalAmount, '(type:', typeof totalAmount, ')')
    
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error(`Invalid total amount: ${orderData.total} -> ${totalAmount}`)
    }
    
    // Convert to paise (Razorpay requires amount in smallest currency unit as INTEGER)
    const amountInPaise = Math.round(totalAmount * 100)
    console.log('💰 Amount in paise for Razorpay:', amountInPaise)
    
    // Validate minimum amount (₹1 = 100 paise)
    if (amountInPaise < 100) {
      throw new Error(`Amount too small: ₹${totalAmount}. Minimum is ₹1.00`)
    }
    
    const requestPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      // Backend expects these at the top level for totals calculation
      addressId: orderData.addressId,
      couponCode: orderData.couponCode || '',
      useWalletBalance: !!orderData.useWalletBalance,
      freeDeliveryCode: orderData.freeDeliveryCode || '',
      notes: {
        userId: orderData.userId,
        orderId: orderData.orderId,
        addressId: orderData.addressId,
        couponCode: orderData.couponCode || '',
        originalAmount: totalAmount,
        items: JSON.stringify(orderData.items || [])
      }
    }
    
    console.log('📤 Sending request to backend:', requestPayload)
    
    const response = await axios.post(
      `${backendUrl}/api/payments/create-razorpay-order`,
      requestPayload,
      { headers: getAuthHeaders() }
    )
    
    console.log('✅ Full backend response:', response.data)
    
    // Enhanced response validation - check for different response structures
    let responseData = null
    
    // Try multiple possible response structures
    if (response.data) {
      // Case 1: response.data.success structure
      if (response.data.success && response.data.data) {
        responseData = response.data.data
        console.log('📋 Using response.data.data structure')
      }
      // Case 2: response.data.order structure
      else if (response.data.order) {
        responseData = response.data.order
        console.log('📋 Using response.data.order structure')
      }
      // Case 3: response.data.razorpayOrder structure
      else if (response.data.razorpayOrder) {
        responseData = response.data.razorpayOrder
        console.log('📋 Using response.data.razorpayOrder structure')
      }
      // Case 4: Direct response.data structure (if it has required fields)
      else if (response.data.id || response.data.order_id || response.data.razorpay_order_id) {
        responseData = response.data
        console.log('📋 Using direct response.data structure')
      }
      // Case 5: Check if response.data has nested data
      else if (response.data.result) {
        responseData = response.data.result
        console.log('📋 Using response.data.result structure')
      }
    }
    
    console.log('🔍 Extracted response data:', responseData)
    
    // Validate response with more flexible checks
    if (!responseData) {
      console.error('❌ No valid response data found in:', response.data)
      console.error('❌ Response structure analysis:', {
        hasSuccess: !!response.data?.success,
        hasData: !!response.data?.data,
        hasOrder: !!response.data?.order,
        hasRazorpayOrder: !!response.data?.razorpayOrder,
        hasResult: !!response.data?.result,
        hasDirectId: !!(response.data?.id || response.data?.order_id),
        responseKeys: Object.keys(response.data || {})
      })
      throw new Error('No valid response data received from payment service')
    }
    
    // Enhanced order ID extraction with multiple fallbacks
    const orderIdFields = [
      'id',
      'order_id', 
      'razorpay_order_id',
      'orderId',
      '_id',
      'razorpayOrderId'
    ]
    
    let orderId = null
    for (const field of orderIdFields) {
      if (responseData[field]) {
        orderId = responseData[field]
        console.log(`✅ Found order ID in field '${field}':`, orderId)
        break
      }
    }
    
    if (!orderId) {
      console.error('❌ No order ID found in response data:', responseData)
      console.error('❌ Checked fields:', orderIdFields)
      console.error('❌ Available fields:', Object.keys(responseData))
      
      // Last resort: try to find any field that looks like an order ID
      const possibleOrderIds = Object.entries(responseData).filter(([key, value]) => 
        typeof value === 'string' && 
        (key.toLowerCase().includes('order') || key.toLowerCase().includes('id')) &&
        value.length > 5 // Reasonable length for an ID
      )
      
      if (possibleOrderIds.length > 0) {
        orderId = possibleOrderIds[0][1]
        console.log(`⚠️ Using fallback order ID from '${possibleOrderIds[0][0]}':`, orderId)
      } else {
        throw new Error(`Invalid response: Missing order ID from payment service. Available fields: ${Object.keys(responseData).join(', ')}`)
      }
    }
    
    // Enhanced amount extraction with multiple fallbacks
    const amountFields = ['amount', 'amount_due', 'total', 'totalAmount', 'order_amount']
    let responseAmount = null
    
    for (const field of amountFields) {
      if (responseData[field] !== undefined && responseData[field] !== null) {
        responseAmount = responseData[field]
        console.log(`✅ Found amount in field '${field}':`, responseAmount)
        break
      }
    }
    
    if (responseAmount === null || responseAmount === undefined) {
      console.warn('⚠️ No amount found in response, using original amount:', amountInPaise)
      responseAmount = amountInPaise
    }
    
    // Verify amount matches what we sent (with some tolerance for rounding)
    const expectedAmount = amountInPaise
    const receivedAmount = parseInt(responseAmount)
    
    if (Math.abs(receivedAmount - expectedAmount) > 1) { // Allow 1 paise difference for rounding
      console.warn('⚠️ Amount mismatch!')
      console.warn('Expected:', expectedAmount, 'paise (₹' + (expectedAmount / 100) + ')')
      console.warn('Received:', receivedAmount, 'paise (₹' + (receivedAmount / 100) + ')')
      // Don't throw error, just warn - some payment gateways might have slight differences
    }
    
    // Create standardized response object
    const standardizedResponse = {
      id: orderId,
      amount: receivedAmount,
      currency: responseData.currency || 'INR',
      receipt: responseData.receipt || requestPayload.receipt,
      status: responseData.status || 'created',
      created_at: responseData.created_at || responseData.createdAt || Date.now(),
      notes: responseData.notes || requestPayload.notes,
      // Include original response for debugging
      _original: responseData,
      _fullResponse: response.data
    }
    
    console.log('✅ Standardized response:', standardizedResponse)
    console.log('💰 Final amount for Razorpay:', standardizedResponse.amount, 'paise (₹' + (standardizedResponse.amount / 100) + ')')
    
    return standardizedResponse
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error)
    
    // Enhanced error logging
    if (error.response) {
      console.error('📡 Backend response status:', error.response.status)
      console.error('📡 Backend response headers:', error.response.headers)
      console.error('📡 Backend response data:', error.response.data)
      
      // Check for specific error types
      if (error.response.status === 401) {
        throw new Error('Authentication failed. Please login again.')
      } else if (error.response.status === 400) {
        const errorMsg = error.response.data?.message || error.response.data?.error || 'Invalid request data'
        throw new Error(`Bad request: ${errorMsg}`)
      } else if (error.response.status === 500) {
        throw new Error('Payment service temporarily unavailable. Please try again.')
      } else {
        const errorMsg = error.response.data?.message || error.response.data?.error || 'Backend error occurred'
        throw new Error(`Payment service error: ${errorMsg}`)
      }
    } else if (error.request) {
      console.error('📡 No response received:', error.request)
      throw new Error('Network error: Unable to connect to payment service. Please check your internet connection.')
    } else {
      console.error('📡 Request setup error:', error.message)
      throw new Error(`Request error: ${error.message}`)
    }
  }
}

// Verify payment and create order
export const verifyPaymentAndCreateOrder = async (paymentData) => {
  try {
    console.log('🔍 Verifying payment and creating order:', paymentData)
    
    const response = await axios.post(
      `${backendUrl}/api/payments/verify-and-create-order`,
      {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        // Backend expects these at the top level
        addressId: paymentData.orderDetails.addressId,
        notes: typeof paymentData.orderDetails.notes === 'string'
          ? paymentData.orderDetails.notes
          : JSON.stringify(paymentData.orderDetails.notes || {}),
        couponCode: paymentData.orderDetails.couponCode || '',
        useWalletBalance: !!paymentData.orderDetails.useWalletBalance,
        freeDeliveryCode: paymentData.orderDetails.freeDeliveryCode || '',
        orderDetails: {
          orderId: paymentData.orderDetails.orderId,
          addressId: paymentData.orderDetails.addressId,
          totalAmount: paymentData.orderDetails.totalAmount,
          currency: paymentData.orderDetails.currency || 'INR',
          couponCode: paymentData.orderDetails.couponCode || '',
          freeDeliveryCode: paymentData.orderDetails.freeDeliveryCode || '',
          notes: paymentData.orderDetails.notes || {},
          items: paymentData.orderDetails.items || [],
          paymentMethod: 'razorpay'
        }
      },
      { headers: getAuthHeaders() }
    )
    
    console.log('✅ Payment verified and order created:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ Error verifying payment:', error)
    if (error.response) {
      console.error('Backend error details:', error.response.data)
      throw new Error(error.response.data.message || 'Payment verification failed')
    }
    throw error
  }
}

// Initialize Razorpay payment - MAIN FUNCTION (Updated)
export const initializeRazorpayPayment = async (orderDetails, userDetails, onSuccess, onFailure) => {
  try {
    console.log('🎯 Initializing Razorpay payment')
    console.log('📋 Order details received:', orderDetails)
    console.log('👤 User details received:', userDetails)
    
    // Step 1: Check authentication first
    const authCheck = checkUserAuthentication()
    console.log('🔐 Authentication status:', authCheck)
    
    if (!authCheck.isAuthenticated) {
      const errorMsg = !authCheck.hasValidToken 
        ? 'No valid authentication token found. Please login again.'
        : 'User identification failed. Please ensure you are logged in properly.'
      throw new Error(errorMsg)
    }
    
    // Step 2: Validate inputs
    if (!orderDetails || !userDetails) {
      throw new Error('Order details and user details are required')
    }

    // Enhanced validation with better error messages and fallbacks
    const validateOrderData = () => {
      const errors = []
      
      // Check total amount with multiple fallbacks
      const totalSources = [
        orderDetails.total,
        orderDetails.totalAmount,
        orderDetails.amount,
        orderDetails.grandTotal
      ]
      
      const validTotal = totalSources.find(total => {
        if (typeof total === 'string') {
          const parsed = parseFloat(total.replace(/[₹,\s]/g, ''))
          return !isNaN(parsed) && parsed > 0
        }
        return typeof total === 'number' && total > 0
      })
      
      if (!validTotal) {
        errors.push(`Total amount not found. Checked: ${JSON.stringify(totalSources)}`)
      }
      
      // Enhanced userId validation with authentication fallback
      const userIdSources = [
        orderDetails.userId,
        orderDetails.user_id,
        userDetails.userId,
        userDetails.user_id,
        userDetails.id,
        userDetails._id,
        authCheck.userId, // Use from authentication check
        authCheck.userEmail // Fallback to email if no userId
      ]
      
      // Filter out empty strings, null values, and undefined
      const validUserId = userIdSources.find(id => 
        id && 
        id.toString().trim().length > 0 &&
        id !== 'null' &&
        id !== 'undefined'
      )
      
      if (!validUserId) {
        errors.push(`User ID not found. Checked sources: ${JSON.stringify(userIdSources)}`)
        errors.push('Please try logging out and logging back in.')
      }
      
      // Check addressId with multiple fallbacks
      const addressIdSources = [
        orderDetails.addressId,
        orderDetails.address_id,
        orderDetails.selectedAddress?._id,
        orderDetails.selectedAddress?.id,
        orderDetails.shippingAddress?._id,
        orderDetails.shippingAddress?.id,
        userDetails.addressId,
        userDetails.selectedAddress?._id
      ]
      
      const validAddressId = addressIdSources.find(id => 
        id && 
        id.toString().trim().length > 0 &&
        id !== 'null' &&
        id !== 'undefined'
      )
      
      if (!validAddressId) {
        errors.push(`Address ID not found. Please select a delivery address.`)
        console.error('❌ Address ID sources checked:', addressIdSources)
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        validatedData: {
          total: validTotal,
          userId: validUserId,
          addressId: validAddressId
        }
      }
    }
    
    const validation = validateOrderData()
    
    if (!validation.isValid) {
      console.error('❌ Validation failed:', validation.errors)
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    console.log('✅ Validation passed:', validation.validatedData)
    
    // Use validated data for further processing
    const { total: validTotal, userId: validUserId, addressId: validAddressId } = validation.validatedData

    // Enhanced amount validation
    let totalAmount = 0
    
    if (typeof validTotal === 'string') {
      totalAmount = parseFloat(validTotal.replace(/[₹,\s]/g, ''))
    } else if (typeof validTotal === 'number') {
      totalAmount = validTotal
    }
    
    console.log('💰 Processing payment for amount: ₹' + totalAmount)
    
    if (isNaN(totalAmount) || totalAmount <= 0) {
      throw new Error(`Invalid order total: ${validTotal} -> ${totalAmount}`)
    }
    
    // Step 3: Load Razorpay script
    console.log('📜 Loading Razorpay script...')
    const scriptLoaded = await loadRazorpayScript()
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay script. Please check your internet connection.')
    }
    console.log('✅ Razorpay script loaded successfully')

    // Step 4: Create Razorpay order with validated data
    console.log('🏗️ Creating Razorpay order...')
    const razorpayOrderData = await createRazorpayOrder({
      ...orderDetails,
      total: totalAmount,
      userId: validUserId,
      addressId: validAddressId
    })
    console.log('✅ Razorpay order created:', razorpayOrderData)
    
    // Step 5: Validate Razorpay key
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!razorpayKey) {
      throw new Error('Razorpay key not configured. Please check VITE_RAZORPAY_KEY_ID in environment variables.')
    }
    console.log('🔑 Razorpay key found:', razorpayKey.substring(0, 10) + '...')

    // Step 6: Calculate display amount
    const displayAmount = razorpayOrderData.amount / 100
    console.log('💰 Display amount: ₹' + displayAmount)

    // Step 7: Prepare Razorpay options with enhanced user data
    const options = {
      key: razorpayKey,
      amount: razorpayOrderData.amount, // Amount in paise (integer)
      currency: 'INR',
      name: 'CHOOSEMOOD',
      description: `Order Payment - Total: ₹${displayAmount.toFixed(2)}`,
      order_id: razorpayOrderData.id,
      image: '/logo.png',
      prefill: {
        name: userDetails.name || userDetails.fullName || userDetails.userName || 'Customer',
        email: userDetails.email || userDetails.userEmail || authCheck.userEmail || '',
        contact: userDetails.phone || userDetails.phoneNumber || userDetails.mobile || ''
      },
      theme: {
        color: '#667eea',
        backdrop_color: 'rgba(102, 126, 234, 0.1)'
      },
      modal: {
        ondismiss: () => {
          console.log('💳 Payment modal dismissed by user')
          if (onFailure) onFailure('Payment cancelled by user')
        },
        confirm_close: true,
        escape: true,
        animation: true
      },
      handler: async (response) => {
        try {
          console.log('💳 Payment successful! Response:', response)
          console.log('💰 Payment amount: ₹' + displayAmount)
          
          // Verify payment and create order with validated data
          const verificationResult = await verifyPaymentAndCreateOrder({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderDetails: {
              ...orderDetails,
              userId: validUserId,
              addressId: validAddressId,
              razorpayOrderId: razorpayOrderData.id,
              totalAmount: displayAmount,
              paidAmount: razorpayOrderData.amount,
              notes: orderDetails.notes || {},
              couponCode: orderDetails.couponCode || ''
            }
          })
          
          console.log('✅ Order created successfully:', verificationResult)
          if (onSuccess) onSuccess(verificationResult)
        } catch (error) {
          console.error('❌ Payment verification failed:', error)
          if (onFailure) onFailure(error.message || 'Payment verification failed')
        }
      }
    }

    // Step 8: Enhanced logging before opening Razorpay
    console.log('🎯 Final Razorpay options:')
    console.log('  🔑 Key:', options.key.substring(0, 10) + '...')
    console.log('  💰 Amount (paise):', options.amount)
    console.log('  💰 Amount (rupees):', options.amount / 100)
    console.log('  💳 Currency:', options.currency)
    console.log('  📝 Description:', options.description)
    console.log('  🆔 Order ID:', options.order_id)
    console.log('  👤 Prefill name:', options.prefill.name)
    console.log('  📧 Prefill email:', options.prefill.email)
    console.log('  📞 Prefill contact:', options.prefill.contact)

    // Validate critical options
    if (!options.amount || options.amount <= 0) {
      throw new Error(`Invalid amount for Razorpay: ${options.amount}`)
    }
    
    if (!options.order_id) {
      throw new Error('Missing order_id for Razorpay')
    }

    // Step 9: Open Razorpay checkout
    console.log('🚀 Opening Razorpay checkout...')
    const razorpay = new window.Razorpay(options)
    
    razorpay.on('payment.failed', (response) => {
      console.error('💳 Payment failed:', response.error)
      if (onFailure) onFailure(response.error.description || 'Payment failed')
    })
    
    razorpay.open()
    
  } catch (error) {
    console.error('❌ Error initializing Razorpay:', error)
    if (onFailure) onFailure(error.message || 'Failed to initialize payment')
  }
}
