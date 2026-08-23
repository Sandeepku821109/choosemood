import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { backendUrl } from "../../App";
import axios from "axios";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const authToken = localStorage.getItem('authToken')
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json'
  }
  
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  } else if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

// Step 1: Create Razorpay order (no internal order yet)
export const createRazorpayOrder = createAsyncThunk(
  "payment/createRazorpayOrder",
  async (orderData, { rejectWithValue, getState }) => {
    try {
      console.log('🚀 Creating Razorpay order:', orderData)
      
      // Get state for fallback data
      const state = getState()
      const selectedAddress = state.address?.selectedAddress || state.addresses?.selectedAddress
      
      // Enhanced validation with fallbacks
      const validateAndExtractData = (data) => {
        // Extract total amount with multiple fallbacks
        let totalAmount = 0
        const totalSources = [data.total, data.totalAmount, data.amount, data.grandTotal]
        
        for (const total of totalSources) {
          if (typeof total === 'string') {
            const parsed = parseFloat(total.replace(/[₹,\s]/g, ''))
            if (!isNaN(parsed) && parsed > 0) {
              totalAmount = parsed
              break
            }
          } else if (typeof total === 'number' && total > 0) {
            totalAmount = total
            break
          }
        }
        
        // Extract userId with fallbacks
        const userIdSources = [
          data.userId,
          data.user_id,
          localStorage.getItem('userId'),
          localStorage.getItem('user_id'),
          localStorage.getItem('userEmail')
        ]
        const userId = userIdSources.find(id => id && id.toString().length > 0)
        
        // Extract addressId with fallbacks
        const addressIdSources = [
          data.addressId,
          data.address_id,
          data.selectedAddress?._id,
          data.selectedAddress?.id,
          selectedAddress?._id,
          selectedAddress?.id
        ]
        const addressId = addressIdSources.find(id => id && id.toString().length > 0)
        
        return { totalAmount, userId, addressId }
      }
      
      const { totalAmount, userId, addressId } = validateAndExtractData(orderData)
      
      // Validation
      if (totalAmount <= 0 || isNaN(totalAmount)) {
        throw new Error(`Invalid total amount: ${orderData.total} -> ${totalAmount}`)
      }
      
      if (!userId) {
        throw new Error('User ID is required. Please login again.')
      }
      
      if (!addressId) {
        throw new Error('Address ID is required. Please select a delivery address.')
      }
      
      // Convert to paise and ensure it's an integer
      const amountInPaise = Math.round(totalAmount * 100)
      
      const requestPayload = {
        amount: amountInPaise, // Must be integer in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          userId: userId,
          items: JSON.stringify(orderData.items || []),
          orderId: orderData.orderId || `order_${Date.now()}`,
          addressId: addressId,
          couponCode: orderData.couponCode || '',
          originalAmount: totalAmount,
          ...orderData.notes // Include any additional notes
        }
      }

      console.log('📤 Sending Razorpay order request:', requestPayload)

      const response = await axios.post(`${backendUrl}/api/payments/create-razorpay-order`, requestPayload, {
        headers: getAuthHeaders()
      });

      console.log('✅ Razorpay order created:', response.data)
      return response.data;
    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error)
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create Razorpay order');
    }
  }
);

// Step 2: Verify payment and create internal order
export const verifyPaymentAndCreateOrder = createAsyncThunk(
  "payment/verifyPaymentAndCreateOrder",
  async (paymentData, { rejectWithValue }) => {
    try {
      console.log('🔍 Verifying payment and creating order:', paymentData)
      
      // Validate required payment data
      if (!paymentData.razorpay_order_id || !paymentData.razorpay_payment_id || !paymentData.razorpay_signature) {
        throw new Error('Missing required payment verification data')
      }
      
      if (!paymentData.orderDetails?.addressId) {
        throw new Error('Address ID is required for order creation')
      }
      
      const requestPayload = {
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
        orderDetails: {
          orderId: paymentData.orderDetails.orderId,
          addressId: paymentData.orderDetails.addressId,
          totalAmount: paymentData.orderDetails.totalAmount,
          currency: paymentData.orderDetails.currency || 'INR',
          couponCode: paymentData.orderDetails.couponCode || '',
          notes: paymentData.orderDetails.notes || {},
          items: paymentData.orderDetails.items || [],
          paymentMethod: 'razorpay',
          paymentStatus: 'completed'
        }
      }

      console.log('📤 Sending verification request:', requestPayload)

      const response = await axios.post(`${backendUrl}/api/payments/verify-and-create-order`, requestPayload, {
        headers: getAuthHeaders()
      });

      console.log('✅ Payment verified and order created:', response.data)
      return response.data;
    } catch (error) {
      console.error('❌ Error verifying payment:', error)
      return rejectWithValue(error.response?.data?.message || 'Payment verification failed');
    }
  }
);

// Cash on Delivery (improved version with better data handling)
export const cashOnDelivery = createAsyncThunk(
  "payment/cashOnDelivery",
  async (orderData, { rejectWithValue, getState }) => {
    try {
      console.log('🚀 Creating COD order with full data:', orderData)
      
      // Enhanced validation with detailed logging
      if (!orderData) {
        throw new Error('Order data is required')
      }

      console.log('🔍 Checking addressId:', {
        addressId: orderData.addressId,
        hasAddressId: !!orderData.addressId,
        typeOfAddressId: typeof orderData.addressId,
        allKeys: Object.keys(orderData)
      })

      // Check for addressId in different possible locations with Redux state fallback
      const state = getState()
      const selectedAddress = state.address?.selectedAddress || state.addresses?.selectedAddress
      
      const addressId = orderData.addressId || 
                       orderData.address_id || 
                       orderData.address?.id || 
                       orderData.address?._id ||
                       orderData.selectedAddress?._id ||
                       orderData.selectedAddress?.id ||
                       selectedAddress?._id ||
                       selectedAddress?.id

      console.log('🔍 Address resolution:', {
        fromOrderData: orderData.addressId,
        fromReduxState: selectedAddress?._id,
        finalAddressId: addressId,
        selectedAddress: selectedAddress
      })

      if (!addressId) {
        console.error('❌ Address ID not found in any expected location:', {
          orderData,
          reduxSelectedAddress: selectedAddress,
          checkedPaths: [
            'orderData.addressId',
            'orderData.address_id', 
            'orderData.address.id',
            'orderData.address._id',
            'orderData.selectedAddress._id',
            'orderData.selectedAddress.id',
            'state.address.selectedAddress._id',
            'state.addresses.selectedAddress._id'
          ]
        })
        throw new Error('Address ID is required for COD order. Please select a delivery address.')
      }

      // Validate required fields
      if (!orderData.items || orderData.items.length === 0) {
        console.error('❌ No items found:', orderData.items)
        throw new Error('Order items are required')
      }

      // Enhanced total validation
      let totalAmount = 0
      if (typeof orderData.total === 'string') {
        totalAmount = parseFloat(orderData.total.replace(/[₹,\s]/g, ''))
      } else if (typeof orderData.total === 'number') {
        totalAmount = orderData.total
      } else if (orderData.totalAmount) {
        totalAmount = parseFloat(orderData.totalAmount)
      }

      if (!totalAmount || totalAmount <= 0 || isNaN(totalAmount)) {
        console.error('❌ Invalid total amount:', {
          original: orderData.total,
          parsed: totalAmount,
          totalAmount: orderData.totalAmount
        })
        throw new Error('Valid order total is required')
      }

      // Enhanced user authentication check section for COD
      const getAuthToken = () => {
        return localStorage.getItem('authToken') || localStorage.getItem('token')
      }

      const token = getAuthToken()
      if (!token) {
        console.error('❌ No authentication token found')
        throw new Error('Authentication required. Please login again to place COD order.')
      }

      console.log('✅ Authentication token found, proceeding with user data extraction')

      // Get user info from localStorage with comprehensive fallbacks
      const getUserData = () => {
        // Get all possible user identifiers from localStorage
        const userId = localStorage.getItem('userId') || localStorage.getItem('user_id')
        const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('user_email') || localStorage.getItem('email')
        const userName = localStorage.getItem('userName') || localStorage.getItem('user_name')

        // Try to get user data from Redux state as fallback
        const authState = state.auth || state.user || {}
        const reduxUser = authState.user || authState.currentUser || authState.userData || {}

        // Create comprehensive user data object
        const userData = {
          userId: userId || reduxUser.id || reduxUser._id || userEmail,
          userEmail: userEmail || reduxUser.email || userId,
          userName: userName || reduxUser.name || reduxUser.fullName || 'User',
          hasValidToken: !!token
        }

        console.log('🔍 User data extraction details:', {
          localStorage: {
            userId: localStorage.getItem('userId'),
            userEmail: localStorage.getItem('userEmail'),
            userName: localStorage.getItem('userName'),
            token: !!localStorage.getItem('token'),
            authToken: !!localStorage.getItem('authToken')
          },
          reduxUser,
          extractedUserData: userData,
          allLocalStorageKeys: Object.keys(localStorage)
        })

        return userData
      }

      const userData = getUserData()
      
      // Enhanced validation - ensure we have at least userId or userEmail
      if (!userData.userId && !userData.userEmail) {
        console.error('❌ No valid user identifier found:', {
          userData,
          localStorageContents: {
            userId: localStorage.getItem('userId'),
            userEmail: localStorage.getItem('userEmail'),
            userName: localStorage.getItem('userName'),
            allKeys: Object.keys(localStorage)
          },
          reduxState: state.auth || state.user || 'No auth state'
        })
        
        // Try to fetch user data from backend using token
        try {
          console.log('🔄 Attempting to fetch user data from backend...')
          const userResponse = await axios.get(`${backendUrl}/api/users/profile`, {
            headers: getAuthHeaders()
          })
          
          const backendUser = userResponse.data.data || userResponse.data.user || userResponse.data
          
          if (backendUser) {
            // Store the fetched user data in localStorage
            const fetchedUserId = backendUser.id || backendUser._id || backendUser.email
            const fetchedEmail = backendUser.email
            const fetchedName = backendUser.name || backendUser.fullName || 'User'
            
            if (fetchedUserId) localStorage.setItem('userId', fetchedUserId)
            if (fetchedEmail) localStorage.setItem('userEmail', fetchedEmail)
            if (fetchedName) localStorage.setItem('userName', fetchedName)
            
            // Update userData with fetched information
            userData.userId = fetchedUserId
            userData.userEmail = fetchedEmail
            userData.userName = fetchedName
            
            console.log('✅ User data fetched from backend:', userData)
          }
        } catch (fetchError) {
          console.error('❌ Failed to fetch user data from backend:', fetchError.message)
          throw new Error('User authentication required. Please login again to place COD order.')
        }
      }

      // Final validation after potential backend fetch
      if (!userData.userId && !userData.userEmail) {
        throw new Error('User authentication required. Please login again to place COD order.')
      }

      // Use email as fallback for userId if userId is not available
      const finalUserId = userData.userId || userData.userEmail
      const finalUserEmail = userData.userEmail || userData.userId
      
      console.log('✅ User authentication successful:', {
        finalUserId,
        finalUserEmail,
        userName: userData.userName,
        hasToken: !!token
      })
      
      // Get user info from localStorage with fallbacks
      const userId = finalUserId
      const userEmail = finalUserEmail

      // Get shipping address details
      let shippingAddress = orderData.shippingAddress || 
                           orderData.selectedAddress || 
                           selectedAddress || 
                           null

      // If we don't have shipping address, try to fetch it
      if (!shippingAddress && addressId) {
        try {
          console.log('🔍 Fetching address details for addressId:', addressId)
          const addressResponse = await axios.get(`${backendUrl}/api/addresses/${addressId}`, {
            headers: getAuthHeaders()
          });
          
          if (addressResponse.data.success) {
            shippingAddress = addressResponse.data.address || addressResponse.data.data;
          } else {
            shippingAddress = addressResponse.data.address || addressResponse.data;
          }
          
          console.log('✅ Address details fetched:', shippingAddress)
        } catch (addressError) {
          console.warn('⚠️ Failed to fetch address details:', addressError.message)
          // Create a minimal address object
          shippingAddress = {
            _id: addressId,
            fullName: 'Address details pending',
            address: 'Please check order details for complete address'
          }
        }
      }
      
      const requestPayload = {
        userId: userId,
        userEmail: userEmail,
        addressId: addressId,
        shippingAddress: shippingAddress,
        items: orderData.items,
        total: totalAmount,
        totalAmount: totalAmount,
        subtotal: orderData.subtotal || totalAmount,
        shipping: orderData.shipping || 0,
        tax: orderData.tax || 0,
        discount: orderData.discount || 0,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        orderStatus: 'confirmed',
        notes: typeof orderData.notes === 'string' ? orderData.notes : JSON.stringify(orderData.notes || {}),
        couponCode: orderData.couponCode || '',
        freeDeliveryCode: orderData.freeDeliveryCode || '',
        useWalletBalance: !!orderData.useWalletBalance,
        currency: 'INR'
      }

      console.log('📤 Sending COD order request:', requestPayload)

      // Try multiple possible endpoints with better error handling
      let response;
      let lastError;
      
      const endpoints = [
        { url: `${backendUrl}/api/payments/cod`, name: 'COD endpoint' },
        { url: `${backendUrl}/api/orders`, name: 'Orders endpoint' },
        { url: `${backendUrl}/api/orders/create`, name: 'Create orders endpoint' }
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying ${endpoint.name}: ${endpoint.url}`)
          response = await axios.post(endpoint.url, requestPayload, {
            headers: getAuthHeaders(),
            timeout: 30000 // 30 second timeout
          });
          console.log(`✅ Success with ${endpoint.name}:`, response.data)
          break;
        } catch (error) {
          console.log(`❌ ${endpoint.name} failed:`, error.message)
          lastError = error;
          continue;
        }
      }

      // If all endpoints failed, throw the last error
      if (!response) {
        console.error('❌ All endpoints failed for COD order:', lastError)
        throw lastError;
      }

      console.log('✅ Full backend response:', response.data)
      
      // Enhanced response handling with multiple fallbacks
      let order = null;
      let payment = null;
      
      // Try different response structures
      if (response.data) {
        // Case 1: response.data.success structure
        if (response.data.success) {
          order = response.data.order || response.data.data?.order || response.data.data;
          payment = response.data.payment || response.data.data?.payment || {};
        }
        // Case 2: Direct response.data structure
        else if (response.data.order || response.data._id) {
          order = response.data.order || response.data;
          payment = response.data.payment || {};
        }
        // Case 3: response.data.data structure
        else if (response.data.data) {
          order = response.data.data.order || response.data.data;
          payment = response.data.data.payment || {};
        }
        // Case 4: Fallback - use entire response as order
        else {
          order = response.data;
          payment = {};
        }
      }

      console.log('🔍 Extracted order data:', order)
      console.log('🔍 Extracted payment data:', payment)

      // Validate that we have essential order data
      if (!order) {
        console.error('❌ No order data found in response:', response.data)
        throw new Error('Invalid response: No order data received from server')
      }

      // Ensure order has required fields, create them if missing
      const processedOrder = {
        _id: order._id || order.id || `temp_${Date.now()}`,
        orderNumber: order.orderNumber || order._id || order.id || `ORD${Date.now()}`,
        total: order.total || order.totalAmount || totalAmount,
        totalAmount: order.totalAmount || order.total || totalAmount,
        status: order.status || 'confirmed',
        paymentMethod: order.paymentMethod || 'cod',
        paymentStatus: order.paymentStatus || 'pending',
        items: order.items || orderData.items || [],
        shippingAddress: order.shippingAddress || shippingAddress || [],
        createdAt: order.createdAt || new Date().toISOString(),
        userId: order.userId || userId,
        addressId: order.addressId || addressId,
        ...order // Include any other fields from the original order
      };

      // Process payment data
      const processedPayment = {
        _id: payment._id || payment.id || `payment_${Date.now()}`,
        transactionId: payment.transactionId || `COD_${Date.now()}`,
        method: payment.method || 'cod',
        status: payment.status || 'pending',
        amount: payment.amount || totalAmount,
        ...payment // Include any other fields from the original payment
      };

      // Use the shipping address we already have or from order response
      const finalShippingAddress = processedOrder.shippingAddress || shippingAddress || {
        _id: addressId,
        fullName: 'Address details not available',
        address: 'Please check your order confirmation email',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      };
      
      const orderDetails = {
        orderId: processedOrder._id,
        orderNumber: processedOrder.orderNumber,
        totalAmount: processedOrder.totalAmount,
        paymentMethod: 'COD',
        estimatedDelivery: processedOrder.estimatedDelivery || '3-5 business days',
        paymentId: processedPayment._id,
        transactionId: processedPayment.transactionId,
        orderStatus: 'CONFIRMED',
        addressId: addressId,
        shippingAddress: finalShippingAddress,
        items: processedOrder.items,
        createdAt: processedOrder.createdAt,
        status: processedOrder.status
      };

      console.log('✅ Final processed data:', {
        order: processedOrder,
        payment: processedPayment,
        orderDetails: orderDetails
      });
      
      return {
        success: true,
        order: processedOrder,
        payment: processedPayment,
        orderDetails: orderDetails,
        message: 'COD order created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating COD order:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create COD order';
      
      if (error.response) {
        console.error('Backend error response:', error.response.data)
        errorMessage = error.response.data?.message || error.response.data?.error || errorMessage
        
        // Handle specific HTTP status codes
        if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please login again.'
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid order data'
        } else if (error.response.status === 404) {
          errorMessage = 'Order service not found. Please try again.'
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.'
      } else {
        errorMessage = error.message || errorMessage
      }
      
      return rejectWithValue(errorMessage);
    }
  }
);

// Payment slice
const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    loading: false,
    error: null,
    razorpayOrder: null,
    order: null,
    orderDetails: null,
    paymentStatus: null,
    verifying: false
  },
  reducers: {
    clearPaymentState: (state) => {
      state.loading = false
      state.error = null
      state.razorpayOrder = null
      state.order = null
      state.orderDetails = null
      state.paymentStatus = null
      state.verifying = false
    },
    clearError: (state) => {
      state.error = null
    },
    setPaymentStatus: (state, action) => {
      state.paymentStatus = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Razorpay Order
      .addCase(createRazorpayOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createRazorpayOrder.fulfilled, (state, action) => {
        state.loading = false
        state.razorpayOrder = action.payload
        state.error = null
      })
      .addCase(createRazorpayOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Verify Payment and Create Order
      .addCase(verifyPaymentAndCreateOrder.pending, (state) => {
        state.verifying = true
        state.error = null
      })
      .addCase(verifyPaymentAndCreateOrder.fulfilled, (state, action) => {
        state.verifying = false
        state.order = action.payload.order
        state.paymentStatus = 'completed'
        state.error = null
      })
      .addCase(verifyPaymentAndCreateOrder.rejected, (state, action) => {
        state.verifying = false
        state.error = action.payload
        state.paymentStatus = 'failed'
      })
      
      // Cash on Delivery
      .addCase(cashOnDelivery.pending, (state) => {
        state.loading = true
        state.error = null
        state.paymentStatus = null
      })
      .addCase(cashOnDelivery.fulfilled, (state, action) => {
        state.loading = false
        state.order = action.payload.order
        state.orderDetails = action.payload.orderDetails
        state.paymentStatus = 'pending'
        state.error = null
      })
      .addCase(cashOnDelivery.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.paymentStatus = 'failed'
        state.order = null
        state.orderDetails = null
      });
  },
});

export const { clearPaymentState, clearError, setPaymentStatus } = paymentSlice.actions;
export default paymentSlice.reducer;

// Set userId in localStorage when user logs in
export const setUserId = (user) => {
  return (dispatch) => {
    try {
      // Set userId in localStorage
      localStorage.setItem('userId', user.id)
      
      // Optionally, you can also set other user details
      localStorage.setItem('userEmail', user.email)
      localStorage.setItem('userName', user.name)
      
      // Dispatch any other actions if needed
      dispatch({
        type: 'SET_USER',
        payload: user
      });
    } catch (error) {
      console.error('Failed to set user ID:', error)
    }
  }
}

/**
 * Normalize certain localStorage keys so their presence is also represented
 * by explicit boolean flags (stored as string "true"). This is safe: it
 * does NOT overwrite real token values (authToken, token, razorpayid), it
 * only writes separate flag keys that your app can check reliably.
 */
const normalizeLocalStorageFlags = () => {
  try {
    if (localStorage.getItem('authToken')) {
      localStorage.setItem('hasAuthToken', 'true')
    }
    if (localStorage.getItem('token')) {
      localStorage.setItem('hasToken', 'true')
    }
    // razorpay ids may be stored under several keys
    if (localStorage.getItem('razorpayid') || localStorage.getItem('razorpay_order_id') || localStorage.getItem('razorpayOrderId')) {
      localStorage.setItem('hasRazorpayId', 'true')
    }
    if (localStorage.getItem('userId') || localStorage.getItem('user_id')) {
      localStorage.setItem('isLoggedIn', 'true')
    }
  } catch (e) {
    // non-blocking: just log for debug
    console.debug('normalizeLocalStorageFlags error', e)
  }
}

/**
 * Utility to read boolean-like flags from localStorage.
 * Use getLocalBoolean('hasAuthToken') instead of checking token strings directly.
 */
const getLocalBoolean = (key) => {
  try {
    return String(localStorage.getItem(key)).toLowerCase() === 'true'
  } catch (e) {
    return false
  }
}

// Run normalization at module init so flags exist for runtime checks
normalizeLocalStorageFlags()

// Example: use getLocalBoolean where needed
// const hasAuth = getLocalBoolean('hasAuthToken')
