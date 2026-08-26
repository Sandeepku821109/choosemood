import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { backendUrl } from '../../config'

// helper: ensure presence flags exist when relevant localStorage keys are set
const normalizeLocalStorageFlags = () => {
  try {
    if (localStorage.getItem('authToken')) localStorage.setItem('hasAuthToken', 'true')
    if (localStorage.getItem('token')) localStorage.setItem('hasToken', 'true')
    if (localStorage.getItem('userId') || localStorage.getItem('userEmail')) localStorage.setItem('isLoggedIn', 'true')
    if (localStorage.getItem('razorpayid') || localStorage.getItem('razorpayOrderId') || localStorage.getItem('razorpay_order_id')) {
      localStorage.setItem('hasRazorpayId', 'true')
    }
  } catch (e) {
    console.debug('normalizeLocalStorageFlags error', e)
  }
}

const Signup = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSignupSuccess = async (response) => {
    try {
      // Store auth data (do NOT overwrite actual token values with boolean flags)
      if (response?.data?.token) {
        localStorage.setItem('authToken', response.data.token)
        // normalized boolean flags (string "true")
        localStorage.setItem('hasAuthToken', 'true')
        localStorage.setItem('hasToken', 'true')
        localStorage.setItem('isLoggedIn', 'true')
      }

      if (response?.data?.name) {
        localStorage.setItem('userName', response.data.name || (response.data.email || '').split('@')[0])
      }

      // ensure flags exist for other code paths
      normalizeLocalStorageFlags()

      // Navigate first
      navigate('/verifyOtp', { state: { email } })

      // Then reload after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Signup error:', error)
    }
  }

  const submitHandler = async (e) => {
    e.preventDefault()

    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${backendUrl}/api/users/signup`, { email })

      if (response.status === 200 || response.status === 201) {
        // Save email for verification step
        localStorage.setItem('userEmail', email)
        // set login flag so other modules can detect presence reliably
        localStorage.setItem('isLoggedIn', 'true')

        // normalize flags (in case backend returned other values)
        normalizeLocalStorageFlags()

        // navigate to OTP verify (will also call handleSignupSuccess which sets tokens/flags if present)
        navigate('/verifyOtp', { state: { email, type: 'signup' } })

        handleSignupSuccess(response)
      }
    } catch (error) {
      // Handle different error scenarios
      if (error.response?.status === 409) {
        // User already exists
        const { isVerified } = error.response.data

        if (isVerified) {
          setError('Account already exists and is verified. Please login.')
          setTimeout(() => {
            navigate('/login')
          }, 2000)
        } else {
          // User exists but not verified, send to OTP verification
          localStorage.setItem('userEmail', email)
          navigate('/verifyOtp', { state: { email, type: 'signup' } })
        }
      } else {
        setError(error.response?.data?.message || 'Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-[#FFF1F3] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-r from-[#E72744] to-black rounded-full flex items-center justify-center mb-6">
            <svg className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-600 text-sm sm:text-base">Join us today and get started</p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          <form onSubmit={submitHandler} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E72744] focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className={`border rounded-lg p-3 sm:p-4 ${
                error.includes('already exists and is verified') 
                  ? 'bg-[#FFF1F3] border-[#FFC6CF]' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${
                    error.includes('already exists and is verified') 
                      ? 'text-blue-400' 
                      : 'text-red-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {error.includes('already exists and is verified') ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                  <p className={`text-sm ${
                    error.includes('already exists and is verified') 
                      ? 'text-[#E72744]' 
                      : 'text-red-600'
                  }`}>{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E72744] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {error.includes('already exists') ? 'Redirecting...' : 'Creating Account...'}
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Status Messages */}
          {loading && (
            <div className="bg-[#FFF1F3] border border-[#FFC6CF] rounded-lg p-3">
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-[#E72744] mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-[#E72744] text-sm">Checking account status...</p>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">What you'll get:</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free account with full access
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Secure and encrypted data
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24/7 customer support
              </li>
            </ul>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-[#E72744] hover:text-blue-500 transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-[#E72744] hover:text-blue-500">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-[#E72744] hover:text-blue-500">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup