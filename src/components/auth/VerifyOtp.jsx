import axios from '../../utils/api'
import React, { useState, useRef, useEffect } from 'react'
import { backendUrl } from '../../config'
import { useNavigate, useLocation } from 'react-router-dom'

const VerifyOtp = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [email, setEmail] = useState('')
    const [resendLoading, setResendLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const navigate = useNavigate()
    const location = useLocation()
    const inputRefs = useRef([])

    useEffect(() => {
        // Get email from navigation state or localStorage
        const emailFromState = location.state?.email
        const emailFromStorage = localStorage.getItem('userEmail')
        
        if (emailFromState) {
            setEmail(emailFromState)
            localStorage.setItem('userEmail', emailFromState)
        } else if (emailFromStorage) {
            setEmail(emailFromStorage)
        } else {
            // If no email found, redirect to signup
            navigate('/signup')
            return
        }

        // Focus on first input when component mounts
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [location.state, navigate])

    const handleOtpChange = (index, value) => {
        // Only allow single digit and numbers
        if (value.length > 1 || (value && !/^\d$/.test(value))) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        // Clear error when user starts typing
        if (error) setError('')

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        
        // Handle arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6)
        setOtp(newOtp)
        
        // Focus on the last filled input or next empty one
        const nextIndex = Math.min(pastedData.length, 5)
        inputRefs.current[nextIndex]?.focus()
        
        // Clear error when pasting
        if (error) setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const otpString = otp.join('')
        
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits')
            return
        }

        if (!/^\d{6}$/.test(otpString)) {
            setError('OTP must contain only numbers')
            return
        }

        setLoading(true)
        setError('')
        setSuccessMessage('')

        try {
            const flowType = location.state?.type || 'signup'
            const endpoint = flowType === 'login' 
                ? `${backendUrl}/api/users/login` 
                : `${backendUrl}/api/users/verify`

            const response = await axios.post(endpoint, {
                email: email,
                otp: otpString
            })
            
            if (response.status === 200) {
                setSuccessMessage(flowType === 'login' ? 'Login successful!' : 'Account verified successfully!')
                
                // Store auth data — httpOnly cookie is primary; localStorage is fallback
                if (response.data.token) {
                    localStorage.setItem('authToken', response.data.token)
                    localStorage.setItem('token', response.data.token)
                }
                
                localStorage.setItem('isLoggedIn', 'true')
                localStorage.setItem('hasToken', 'true')
                localStorage.setItem('hasAuthToken', 'true')
                
                if (response.data.user) {
                    const user = response.data.user
                    const userId = user.id || user._id || btoa(email).replace(/[^a-zA-Z0-9]/g, '')
                    localStorage.setItem('userId', userId)
                    localStorage.setItem('userEmail', email)
                    if (user.name) localStorage.setItem('userName', user.name)
                    if (user.phoneNumber) localStorage.setItem('userPhone', user.phoneNumber)
                } else {
                    const fallbackUserId = btoa(email).replace(/[^a-zA-Z0-9]/g, '')
                    localStorage.setItem('userId', fallbackUserId)
                    localStorage.setItem('userEmail', email)
                }
                
                const returnUrl = location.state?.returnUrl || location.state?.from || '/'
                const profileCompleted = response.data.user?.profileCompleted

                if (profileCompleted) {
                    // Profile already done — go straight to app
                    window.dispatchEvent(new Event('auth-change'))
                    window.dispatchEvent(new Event('username-updated'))
                    navigate(returnUrl, { replace: true })
                } else {
                    // Collect profile data first
                    setTimeout(() => {
                        navigate('/complete-profile', { replace: true, state: { returnUrl } })
                    }, 1500)
                }
            }
        } catch (error) {
            if (error.response?.status === 400) {
                setError('Invalid or expired OTP. Please try again.')
            } else if (error.response?.status === 404) {
                setError('User not found. Please sign up again.')
            } else {
                setError(error.response?.data?.message || 'Verification failed. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleOtpSuccess = async (response) => {
        try {
            // Store auth data
            localStorage.setItem('authToken', response.data.token)
            localStorage.setItem('userName', response.data.name || response.data.email.split('@')[0])
            
            // Navigate first
            navigate('/')
            
            // Then reload after a short delay
            setTimeout(() => {
                window.location.reload()
            }, 500)
            
        } catch (error) {
            console.error('OTP verification error:', error)
        }
    }

    const resendOtp = async () => {
        if (!email) {
            setError('Email not found. Please go back to signup.')
            return
        }

        setResendLoading(true)
        setError('')
        setSuccessMessage('')

        try {
            // First verify the email exists and then send OTP
            const response = await axios.post(`${backendUrl}/api/users/resend-otp`, {
                email: email
            })
            
            if (response.status === 200) {
                setOtp(['', '', '', '', '', ''])
                inputRefs.current[0]?.focus()
                setSuccessMessage('New OTP sent successfully!')
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage('')
                }, 3000)
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setError('Email not found. Please sign up first.')
            } else if (error.response?.status === 429) {
                setError('Too many requests. Please wait before requesting another OTP.')
            } else {
                setError(error.response?.data?.message || 'Failed to resend OTP. Please try again.')
            }
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md sm:max-w-lg">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Verify Your Account</h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Enter the 6-digit code sent to
                    </p>
                    {email && (
                        <p className="text-indigo-600 font-medium text-sm mt-1 break-all">
                            {email}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center space-x-2 sm:space-x-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className={`w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-semibold border-2 rounded-lg focus:outline-none transition-all duration-200 disabled:bg-gray-50 ${
                                    digit 
                                        ? 'border-indigo-500 bg-indigo-50' 
                                        : 'border-gray-300 hover:border-gray-400'
                                } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200`}
                                disabled={loading || resendLoading}
                            />
                        ))}
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center justify-center">
                                <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-green-600 text-sm">{successMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center justify-center">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || resendLoading || otp.join('').length !== 6}
                        className="w-full bg-gradient-to-r from-[#E72744] to-black text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </div>
                        ) : (
                            'Verify OTP'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
                    <button
                        onClick={resendOtp}
                        disabled={loading || resendLoading || !email}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                        {resendLoading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending...
                            </div>
                        ) : (
                            'Resend OTP'
                        )}
                    </button>
                </div>

                <div className="mt-6 text-center space-y-2">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200 block w-full"
                    >
                        ← Back to Login
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
                    >
                        Don't have an account? Sign up
                    </button>
                </div>

                {/* Progress indicator */}
                <div className="mt-6">
                    <div className="flex justify-center space-x-1">
                        {otp.map((digit, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                    digit ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        {otp.filter(digit => digit).length} of 6 digits entered
                    </p>
                </div>
            </div>
        </div>
    )
}

export default VerifyOtp
