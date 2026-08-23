import React from 'react'

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#E72744] to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              About Our Trusted Store
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/85 max-w-3xl mx-auto leading-relaxed">
              We're passionate about delivering exceptional products and creating meaningful experiences for our customers worldwide with trust and reliability.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Our Mission
                </h2>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4">
                  To revolutionize the way people shop online by providing high-quality products, 
                  exceptional customer service, and innovative solutions that make life easier and more enjoyable.
                </p>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  We believe in building lasting relationships with our customers through trust, 
                  transparency, and continuous improvement.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Our Vision
                </h3>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  To become the world's most trusted and innovative e-commerce platform, 
                  setting new standards for customer satisfaction and product excellence.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square sm:aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Team collaboration"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 bg-[#E72744] rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Our Core Values
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do and shape our company culture
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Value 1 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#E72744] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Quality First</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We never compromise on quality. Every product is carefully selected and tested to meet our high standards.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Customer Centric</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Our customers are at the heart of everything we do. We listen, learn, and adapt to serve them better.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Innovation</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We embrace new technologies and creative solutions to continuously improve our platform and services.
              </p>
            </div>

            {/* Value 4 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Trust & Security</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We protect our customers' data and privacy with the highest security standards and transparent practices.
              </p>
            </div>

            {/* Value 5 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Sustainability</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We're committed to environmentally responsible practices and sustainable business operations for future generations.
              </p>
            </div>

            {/* Value 6 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 text-center hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Integrity</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                We conduct business with honesty, fairness, and ethical principles in all our interactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
