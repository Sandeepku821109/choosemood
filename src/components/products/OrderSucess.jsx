import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, Package, Truck, Clock, ArrowRight, Home, ShoppingBag } from 'lucide-react'

const OrderSucess = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Get order details from navigation state or use defaults
  const orderDetails = location.state?.orderDetails || {
    orderId: 'ORD' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    amount: '₹999',
    estimatedDelivery: '3-5 business days',
    items: 1
  }

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true)
      setShowConfetti(true)
    }, 100)

    // Hide confetti after animation
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false)
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearTimeout(confettiTimer)
    }
  }, [])

  const handleContinueShopping = () => {
    navigate('/collections')
  }

  const handleViewOrders = () => {
    navigate('/orders')
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-[#FFF1F3] relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-r ${
                i % 4 === 0 ? 'from-[#E72744] to-[#C81E38]' :
                i % 4 === 1 ? 'from-black to-neutral-700' :
                i % 4 === 2 ? 'from-[#FF6680] to-[#FF9DAC]' :
                'from-neutral-500 to-neutral-800'
              } rounded-full animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#FFE0E5] to-[#FFC6CF] rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-neutral-100 to-[#FFF1F3] rounded-full opacity-10 animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className={`w-full max-w-md sm:max-w-lg lg:max-w-2xl transition-all duration-1000 transform ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'
        }`}>
          
          {/* Main Success Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-12 text-center relative overflow-hidden">
            
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-white to-[#FFF1F3] opacity-50"></div>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#E72744] to-black"></div>
            
            <div className="relative z-10">
              {/* Success Icon with Animation */}
              <div className={`mx-auto mb-6 sm:mb-8 transition-all duration-1000 delay-300 ${
                isVisible ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}>
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto bg-gradient-to-br from-[#E72744] to-[#C81E38] rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto border-4 border-[#FFC6CF] rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Success Message */}
              <div className={`mb-6 sm:mb-8 transition-all duration-1000 delay-500 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
              }`}>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
                  Order Placed Successfully! 🎉
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                  Thank you for your purchase! Your order has been confirmed and is being processed.
                </p>
              </div>

              {/* Order Details Card */}
              <div className={`bg-gradient-to-r from-gray-50 to-[#FFF1F3] rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 transition-all duration-1000 delay-700 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-sm sm:text-base text-gray-500 mb-1">Order ID</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900 font-mono">{orderDetails.orderId}</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm sm:text-base text-gray-500 mb-1">Total Amount</p>
                    <p className="text-lg sm:text-xl font-bold text-[#E72744]">{orderDetails.amount}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Timeline */}
              <div className={`mb-8 sm:mb-10 transition-all duration-1000 delay-900 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
              }`}>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Order Timeline</h3>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
                  
                  {/* Step 1 - Order Confirmed */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-black">Order Confirmed</p>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>

                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 rotate-90 sm:rotate-0" />

                  {/* Step 2 - Processing */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#E72744] rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300 animate-pulse">
                      <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-[#E72744]">Processing</p>
                    <p className="text-xs text-gray-500">1-2 days</p>
                  </div>

                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 rotate-90 sm:rotate-0" />

                  {/* Step 3 - Shipped */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-[#E72744]">Shipped</p>
                    <p className="text-xs text-gray-500">2-3 days</p>
                  </div>

                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 rotate-90 sm:rotate-0" />

                  {/* Step 4 - Delivered */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neutral-400 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-neutral-500">Delivered</p>
                    <p className="text-xs text-gray-500">{orderDetails.estimatedDelivery}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 transition-all duration-1000 delay-1000 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
              }`}>
                <button
                  onClick={handleContinueShopping}
                  className="flex items-center justify-center gap-2 bg-black hover:bg-neutral-800 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Continue Shopping
                </button>
                
                <button
                  onClick={handleViewOrders}
                  className="flex items-center justify-center gap-2 bg-[#E72744] hover:bg-[#C81E38] text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Package className="w-5 h-5" />
                  View Orders
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="flex items-center justify-center gap-2 bg-white text-black border border-neutral-300 hover:border-black font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSucess
