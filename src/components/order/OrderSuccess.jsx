
import axios from 'axios'
import { backendUrl } from '../../config'
import { useParams, Link, useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'

const OrderSuccess = () => {
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [countdown, setCountdown] = useState(10)
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token')
        const headers = {
          'Content-Type': 'application/json'
        }
        
        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        const response = await axios.get(`${backendUrl}/api/orders/${id}`, { headers })
        setOrder(response.data.data || response.data)
      } catch (error) {
        console.error('Failed to fetch order details:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchOrderDetails()
    }
  }, [id])

  // Countdown timer effect
  useEffect(() => {
    if (!loading && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      navigate('/orders')
    }
  }, [countdown, loading, navigate])

  // Helper function to get payment status display
  const getPaymentStatusDisplay = (paymentStatus, paymentMethod) => {
    if (paymentMethod === 'razorpay' && paymentStatus === 'completed') {
      return { text: 'Prepaid', color: 'text-green-600 bg-green-100', icon: '✓' }
    } else if (paymentMethod === 'cod') {
      return { text: 'Cash on Delivery', color: 'text-[#E72744] bg-orange-100', icon: '💰' }
    } else if (paymentStatus === 'pending') {
      return { text: 'Payment Pending', color: 'text-yellow-600 bg-yellow-100', icon: '⏳' }
    } else if (paymentStatus === 'failed') {
      return { text: 'Payment Failed', color: 'text-red-600 bg-red-100', icon: '❌' }
    }
    return { text: paymentStatus || 'Unknown', color: 'text-gray-600 bg-gray-100', icon: '?' }
  }

  // Helper function to get order status display
  const getOrderStatusDisplay = (orderStatus, paymentMethod, paymentStatus) => {
    // If payment is confirmed via Razorpay, show as Prepaid
    if (paymentMethod === 'razorpay' && paymentStatus === 'completed') {
      return { text: 'Prepaid', color: 'text-green-600 bg-green-100', icon: '✓' }
    } else if (orderStatus === 'prepaid') {
      return { text: 'Prepaid', color: 'text-green-600 bg-green-100', icon: '✓' }
    } else if (orderStatus === 'confirmed') {
      return { text: 'Confirmed', color: 'text-[#E72744] bg-[#FFE0E5]', icon: '📋' }
    } else if (orderStatus === 'processing') {
      return { text: 'Processing', color: 'text-purple-600 bg-purple-100', icon: '⚙️' }
    } else if (orderStatus === 'shipped') {
      return { text: 'Shipped', color: 'text-indigo-600 bg-indigo-100', icon: '🚚' }
    } else if (orderStatus === 'delivered') {
      return { text: 'Delivered', color: 'text-green-600 bg-green-100', icon: '📦' }
    }
    return { text: orderStatus || 'Pending', color: 'text-gray-600 bg-gray-100', icon: '⏳' }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E72744]"></div>
      </div>
    )
  }

  const paymentStatusDisplay = getPaymentStatusDisplay(order?.paymentStatus, order?.paymentMethod)
  const orderStatusDisplay = getOrderStatusDisplay(order?.orderStatus || order?.status, order?.paymentMethod, order?.paymentStatus)

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-6">Your order has been confirmed and will be processed soon.</p>
        
        {order && (
          <div className="text-left bg-gray-50 p-6 rounded-md mb-6 space-y-4">
            {/* Basic Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Order ID:</span> {order.orderNumber || order._id}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Total Amount:</span> ₹{order.total?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              
              <div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${paymentStatusDisplay.color} flex items-center gap-1 inline-flex`}>
                    <span>{paymentStatusDisplay.icon}</span>
                    {paymentStatusDisplay.text}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Order Status:</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${orderStatusDisplay.color} flex items-center gap-1 inline-flex`}>
                    <span>{orderStatusDisplay.icon}</span>
                    {orderStatusDisplay.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details Section */}
            {order.paymentMethod && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-3">Payment Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Payment Method:</span> 
                      {order.paymentMethod === 'cod' ? ' Cash on Delivery' : 
                       order.paymentMethod === 'razorpay' ? ' Online Payment (Razorpay)' : 
                       ` ${order.paymentMethod}`}
                    </p>
                    
                    {/* Show Razorpay Order ID if available */}
                    {(order.razorpayOrderId || order.razorpay_order_id || order.paymentDetails?.razorpayOrderId) && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Razorpay Order ID:</span> 
                        <span className="font-mono text-xs ml-1">
                          {order.razorpayOrderId || order.razorpay_order_id || order.paymentDetails?.razorpayOrderId}
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <div>
                    {/* Show Razorpay Payment ID if available */}
                    {(order.razorpayPaymentId || order.razorpay_payment_id || order.paymentDetails?.razorpayPaymentId) && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Payment ID:</span> 
                        <span className="font-mono text-xs ml-1">
                          {order.razorpayPaymentId || order.razorpay_payment_id || order.paymentDetails?.razorpayPaymentId}
                        </span>
                      </p>
                    )}
                    
                    {/* Show Transaction ID if available */}
                    {(order.transactionId || order.paymentDetails?.transactionId) && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Transaction ID:</span> 
                        <span className="font-mono text-xs ml-1">
                          {order.transactionId || order.paymentDetails?.transactionId}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Payment Info for Razorpay */}
            {order.paymentMethod === 'razorpay' && order.paymentStatus === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-800 font-medium">
                    Payment Successful - Your order is prepaid and confirmed!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Countdown display */}
        <div className="mb-6 p-3 bg-[#FFF1F3] rounded-lg">
          <p className="text-sm text-[#C81E38]">
            Redirecting to orders page in <span className="font-bold text-[#AE1830]">{countdown}</span> seconds...
          </p>
          <div className="w-full bg-[#FFC6CF] rounded-full h-2 mt-2">
            <div 
              className="bg-[#E72744] h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link to={`/invoice/${id}`} className="bg-gray-900 text-white py-2 px-4 rounded hover:bg-black transition-colors flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            View / Download Invoice
          </Link>
          <Link to="/orders" className="bg-[#E72744] text-white py-2 px-4 rounded hover:bg-[#C81E38] transition-colors">
            View Orders Now
          </Link>
          <Link to="/" className="text-[#E72744] hover:text-[#C81E38] transition-colors">
            Continue Shopping
          </Link>
          <button
            onClick={() => setCountdown(0)}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            Skip countdown
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
