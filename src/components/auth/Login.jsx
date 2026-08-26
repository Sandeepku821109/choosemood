import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { backendUrl } from '../../config'
import { clearAuthStorage } from '../../utils/api'
// import { toast } from 'react-toastify'

const Login = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userData, setUserData] = useState(null)
    const [userLoading, setUserLoading] = useState(true) // Start with true to check auth first

    const navigate = useNavigate()
    const location = useLocation()

    // Normalize presence flags in localStorage
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

    // Check if user is already authenticated on component mount
    useEffect(() => {
        // ensure flags exist when component mounts
        normalizeLocalStorageFlags()
        checkAuthentication()
    }, [])

    // Handle messages from previous pages (like "Please login to add to cart")
    useEffect(() => {
        if (location.state?.message) {
            setError(location.state.message)
            // Clear the message after showing it
            setTimeout(() => {
                setError('')
            }, 5000)
        }
    }, [location.state])

    const checkAuthentication = async () => {
        try {
            const authToken = localStorage.getItem('authToken')
            const token = localStorage.getItem('token')
            const userId = localStorage.getItem('userId')
            const userEmail = localStorage.getItem('userEmail')

            console.log('🔐 Checking authentication:', {
                hasAuthToken: !!authToken,
                hasToken: !!token,
                hasUserId: !!userId,
                hasUserEmail: !!userEmail
            })

            // Only consider user authenticated if we have a token
            if (authToken || token) {
                setIsAuthenticated(true)
                // If we don't have user data or userId, fetch it
                if (!userId || !userData) {
                    await fetchUserData()
                } else {
                    // Use existing data but still verify it's valid
                    setUserData({
                        name: 'User',
                        email: userEmail || email,
                        phone: '',
                        profilePicture: '',
                        joinDate: new Date().toISOString(),
                        isVerified: true,
                        userId: userId
                    })
                }
            } else {
                // No valid token found, user needs to login
                setIsAuthenticated(false)
                setUserData(null)
            }
        } catch (error) {
            console.error('Authentication check failed:', error)
            setIsAuthenticated(false)
            setUserData(null)
            // Clear potentially corrupted data
            localStorage.removeItem('authToken')
            localStorage.removeItem('token')
            localStorage.removeItem('userId')
        } finally {
            setUserLoading(false)
        }
    }

    const getAuthHeaders = () => {
        const authToken = localStorage.getItem('authToken')
        const token = localStorage.getItem('token')
        const userEmail = localStorage.getItem('userEmail')

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
        
        return headers
    }

    const fetchUserData = async () => {
        try {
            const headers = getAuthHeaders()
            console.log('📡 Fetching user data with headers:', headers)
            
            const response = await axios.get(`${backendUrl}/api/users/profile`, { headers })
            const user = response.data.data || response.data.user || response.data
            
            console.log('👤 User data received:', user)
            
            // Store user ID in localStorage for future use
            const userId = user.id || user._id || user.userId
            if (userId) {
                localStorage.setItem('userId', userId)
                localStorage.setItem('isLoggedIn', 'true') // flag
            } else {
                const tempId = user.email ? btoa(user.email).replace(/[^a-zA-Z0-9]/g, '') : Date.now().toString()
                localStorage.setItem('userId', tempId)
                localStorage.setItem('isLoggedIn', 'true')
            }
            // ensure flags are normalized after storing user info
            normalizeLocalStorageFlags()
            
            setUserData({
                name: user.name || user.fullName || user.userName || 'User',
                email: user.email || localStorage.getItem('userEmail') || '',
                phone: user.phone || user.phoneNumber || user.mobile || '',
                profilePicture: user.profilePicture || user.avatar || '',
                joinDate: user.createdAt || user.joinDate || new Date().toISOString(),
                isVerified: user.isVerified !== undefined ? user.isVerified : true,
                userId: userId
            })
            
        } catch (error) {
            console.error('Error fetching user data:', error)
            
            // If we can't fetch user data but have a token, create fallback data
            const storedEmail = localStorage.getItem('userEmail') || email
            const fallbackUserId = localStorage.getItem('userId') || btoa(storedEmail || 'user').replace(/[^a-zA-Z0-9]/g, '') || Date.now().toString()
            
            // Store the fallback userId
            localStorage.setItem('userId', fallbackUserId)
            localStorage.setItem('isLoggedIn', 'true')
            normalizeLocalStorageFlags()
            
            setUserData({
                name: 'User',
                email: storedEmail,
                phone: '',
                profilePicture: '',
                joinDate: new Date().toISOString(),
                isVerified: true,
                userId: fallbackUserId
            })
            
            console.log('💾 Using fallback user data with userId:', fallbackUserId)
        }
    }

    const handleSubmit = async (e) => {
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
            const response = await axios.post(`${backendUrl}/api/users/login`, { email })

            // Keep email for OTP verification step
            localStorage.setItem('userEmail', email)
            normalizeLocalStorageFlags()

            // If backend returns a token immediately (rare), complete login.
            if (response?.data?.token) {
                await handleLoginSuccess(response)
                return
            }

            // Otherwise navigate to OTP verification page
            navigate('/verifyOtp', { 
                state: { 
                    email,
                    returnUrl: location.state?.returnUrl || location.state?.from || '/'
                }
            })
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleLoginSuccess = async (response) => {
        try {
            // store token(s) - use both keys for consistency across all components
            if (response?.data?.token) {
                localStorage.setItem('authToken', response.data.token)
                localStorage.setItem('token', response.data.token)
                localStorage.setItem('hasAuthToken', 'true')
                localStorage.setItem('hasToken', 'true')
                localStorage.setItem('isLoggedIn', 'true')
            }
            if (response?.data?.name) {
                localStorage.setItem('userName', response.data.name || (response.data.email || '').split('@')[0])
            }
            if (response?.data?.user) {
                const uid = response.data.user._id || response.data.user.id || null
                if (uid) localStorage.setItem('userId', uid)
            }

            // Notify app to refresh authenticated data
            window.dispatchEvent(new Event('auth-change'))
            window.dispatchEvent(new Event('username-updated'))
            window.dispatchEvent(new Event('refresh-user-data'))

            // Ensure Navbar (and other listeners) fetch refreshed data
            // small navigation/reload
            const returnUrl = location.state?.returnUrl || '/'
            navigate(returnUrl)
            setTimeout(() => window.location.reload(), 300)
        } catch (error) {
            console.error('Login error:', error)
        }
    }

    const handleLogout = () => {
        console.log('🚪 Logging out user')
        // Clear the httpOnly session cookie on the backend (fire-and-forget)
        axios.post(`${backendUrl}/api/users/logout`).catch(() => {})
        clearAuthStorage()
        localStorage.removeItem('hasRazorpayId')
        setIsAuthenticated(false)
        setUserData(null)
        setEmail('')
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // Loading state while checking authentication
    if (userLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-white to-[#FFF1F3] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        )
    }

    // If user is authenticated, show user dashboard
    if (isAuthenticated && userData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-white via-white to-[#FFF1F3] p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
                        <p className="text-gray-600">Here's your account information</p>
                    </div>

                    {/* User Profile Card */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-r from-[#E72744] to-black px-6 py-8">
                            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                                {/* Profile Picture */}
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white/20 border-4 border-white/30">
                                    {userData.profilePicture ? (
                                        <img 
                                            src={userData.profilePicture} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/20">
                                            <span className="text-3xl sm:text-4xl font-bold text-white">
                                                {userData.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="text-center sm:text-left text-white flex-1">
                                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">{userData.name}</h2>
                                    <p className="text-purple-100 text-sm sm:text-base mb-1">{userData.email}</p>
                                    <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                                        <span className="text-purple-200 text-xs sm:text-sm">
                                            Member since {formatDate(userData.joinDate)}
                                        </span>
                                        {userData.isVerified && (
                                            <div className="flex items-center space-x-1">
                                                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-green-300 text-xs">Verified</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium border border-white/30"
                                    >
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="p-6 sm:p-8">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Details</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-900">{userData.name || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-900">{userData.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <p className="text-gray-900">{userData.phone || 'Not provided'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                                    <div className="p-3 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${userData.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            <p className="text-gray-900">{userData.isVerified ? 'Verified' : 'Pending Verification'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/cart')}
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
                        >
                            <div className="w-12 h-12 bg-[#FFE0E5] rounded-lg flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-[#E72744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5m6 0L19 18H7" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">My Cart</h3>
                            <p className="text-sm text-gray-600">View your cart items</p>
                        </button>

                        <button
                            onClick={() => navigate('/wishlist')}
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
                        >
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">My Wishlist</h3>
                            <p className="text-sm text-gray-600">Your saved items</p>
                        </button>

                        <button
                            onClick={() => navigate('/orders')}
                            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
                        >
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">My Orders</h3>
                            <p className="text-sm text-gray-600">Track your orders</p>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-white to-[#FFF1F3] flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-r from-[#E72744] to-black rounded-full flex items-center justify-center mb-6">
                        <svg className="h-8 w-8 sm:h-10 sm:w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                    <p className="text-gray-600 text-sm sm:text-base">Sign in to your account to continue</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                    placeholder="Enter your email"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-[#E72744] to-black hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing In...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
                        >
                            Sign up for free
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        By signing in, you agree to our{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
