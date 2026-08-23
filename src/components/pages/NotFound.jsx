import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search, ShoppingBag, Heart } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleBrowseProducts = () => {
    navigate('/collections')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-8xl sm:text-9xl lg:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#E72744] via-purple-600 to-pink-600 animate-pulse">
            404
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-0 left-1/4 animate-bounce delay-100">
            <div className="w-8 h-8 bg-[#E72744] rounded-full opacity-20"></div>
          </div>
          <div className="absolute top-1/4 right-1/4 animate-bounce delay-300">
            <div className="w-6 h-6 bg-purple-500 rounded-full opacity-30"></div>
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-bounce delay-500">
            <div className="w-4 h-4 bg-pink-500 rounded-full opacity-25"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Oops! Page Not Found
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            The page you're looking for seems to have wandered off into the digital wilderness. 
            Don't worry, even the best explorers sometimes take a wrong turn!
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-12">
          <div className="relative inline-block">
            <svg 
              className="w-64 h-64 sm:w-80 sm:h-80 mx-auto text-gray-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={0.5} 
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20a7.962 7.962 0 01-5-1.709M15 3H9a2 2 0 00-2 2v1.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 000 1.414l6.414 6.414a1 1 0 01.293.707V22a2 2 0 002 2h6a2 2 0 002-2v-1.586a1 1 0 01.293-.707l6.414-6.414a1 1 0 000-1.414L16.707 7.293A1 1 0 0116.414 7V5a2 2 0 00-2-2z" 
              />
            </svg>
            
            {/* Animated Search Icon */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Search className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={handleGoHome}
            className="group flex items-center space-x-2 bg-gradient-to-r from-[#E72744] to-[#0A0A0A] hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <span>Go Home</span>
          </button>
          
          <button
            onClick={handleGoBack}
            className="group flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Go Back</span>
          </button>
          
          <button
            onClick={handleBrowseProducts}
            className="group flex items-center space-x-2 bg-gradient-to-r from-[#E72744] to-black hover:from-[#C81E38] hover:to-neutral-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
          >
            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <span>Browse Products</span>
          </button>
        </div>

        {/* Quick Links */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a 
              href="/collections" 
              className="group flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-[#FFF1F3] transition-all duration-300"
            >
              <div className="w-12 h-12 bg-[#FFE0E5] rounded-full flex items-center justify-center group-hover:bg-[#FFC6CF] transition-colors duration-300">
                <ShoppingBag className="w-6 h-6 text-[#E72744]" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#E72744]">Collections</span>
            </a>
            
            <a 
              href="/wishlist" 
              className="group flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-pink-50 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition-colors duration-300">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-pink-600">Wishlist</span>
            </a>
            
            <a 
              href="/about" 
              className="group flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-purple-50 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-300">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600">About</span>
            </a>
            
            <a 
              href="/contact" 
              className="group flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-green-50 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">Contact</span>
            </a>
          </div>
        </div>

        {/* Fun Message */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Lost? Don't worry, even GPS gets confused sometimes! ðŸ§­
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFound
