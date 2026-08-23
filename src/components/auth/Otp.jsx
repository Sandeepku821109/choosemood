import axios from 'axios'
import React, { useState, useEffect, useRef } from 'react'
import { backendUrl } from '../../config'
import { useNavigate, useLocation } from 'react-router-dom'

const Otp = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resendLoading, setResendLoading] = useState(false)
    const [timer, setTimer] = useState(60)
    const inputRefs = useRef([])

    // Get email from navigation state
    const email = location.state?.email || ''
    const type = location.state?.type || 'signup' // 'login' or 'signup'

    useEffect(() => {
        // Start countdown timer
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => prev - 1)
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [timer])

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus()
        }
    }, [])

    const handleChange = (index, value) => {
        // Only allow numbers
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value

        setOtp(newOtp)
        setError('')

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }

        // Auto-submit when all fields are filled
        if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
            handleSubmit(newOtp.join(''))
        }
    }

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleSubmit = async (otpValue = null) => {
        const otpCode = otpValue || otp.join('')
        
        if (otpCode.length !== 6) {
            setError('Please enter a complete 6-digit OTP')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await axios.post(`${backendUrl}/api/users/verify-otp`, {
                email: email,
                otp: otpCode,
                type: type
            })

            if (response.data.success) {
                // Store token if provided and normalize presence flags
                if (response.data.token) {
                    // store actual token
                    localStorage.setItem('token', response.data.token)
                    // normalized boolean flags (string "true")
                    localStorage.setItem('hasToken', 'true')
                    localStorage.setItem('isLoggedIn', 'true')
                }
                // if backend returns authToken key as well
                if (response.data.authToken) {
                    localStorage.setItem('authToken', response.data.authToken)
                    localStorage.setItem('hasAuthToken', 'true')
                    localStorage.setItem('isLoggedIn', 'true')
                }
                // store user info if returned
                const user = response.data.user || response.data.data?.user
                if (user) {
                    if (user._id) localStorage.setItem('userId', user._id)
                    if (user.id) localStorage.setItem('userId', user.id)
                    if (user.email) localStorage.setItem('userEmail', user.email)
                    if (user.name) localStorage.setItem('userName', user.name)
                    localStorage.setItem('isLoggedIn', 'true')
                }
                // razorpay id flags if present
                if (response.data.razorpayid || response.data.razorpayOrderId || response.data.razorpay_order_id) {
                    localStorage.setItem('hasRazorpayId', 'true')
                }

                // ensure normalized flags exist for other parts of app
                try {
                    if (localStorage.getItem('token')) localStorage.setItem('hasToken', 'true')
                    if (localStorage.getItem('authToken')) localStorage.setItem('hasAuthToken', 'true')
                    if (localStorage.getItem('userId') || localStorage.getItem('userEmail')) localStorage.setItem('isLoggedIn', 'true')
                } catch (e) { /* noop */ }

                // refresh and navigate
                window.location.reload()
                navigate('/')
                
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Invalid OTP. Please try again.')
            // Clear OTP on error
            setOtp(['', '', '', '', '', ''])
            inputRefs.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        setResendLoading(true)
        setError('')

        try {
            const endpoint = type === 'login' ? '/api/users/login' : '/api/users/signup'
            await axios.post(`${backendUrl}${endpoint}`, { email: email })
            
            setTimer(60) // Reset timer
            setOtp(['', '', '', '', '', '']) // Clear current OTP
            inputRefs.current[0]?.focus()
        } catch (error) {
            setError('Failed to resend OTP. Please try again.')
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF1F3] flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Verify Your Email
                        </h2>
                        <p className="text-gray-600 mb-2">
                            We've sent a 6-digit code to
                        </p>
                        <p className="text-sm font-medium text-green-600">
                            {email}
                        </p>
                    </div>

                    {/* OTP Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                            Enter verification code
                        </label>
                        <div className="flex justify-center space-x-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors duration-200"
                                    disabled={loading}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={() => handleSubmit()}
                        disabled={loading || otp.some(digit => digit === '')}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center mb-4"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verifying...
                            </>
                        ) : (
                            'Verify Code'
                        )}
                    </button>

                    {/* Resend Section */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            Didn't receive the code?
                        </p>
                        {timer > 0 ? (
                            <p className="text-sm text-gray-500">
                                Resend code in {timer}s
                            </p>
                        ) : (
                            <button
                                onClick={handleResendOtp}
                                disabled={resendLoading}
                                className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors duration-200 disabled:text-gray-400"
                            >
                                {resendLoading ? 'Sending...' : 'Resend Code'}
                            </button>
                        )}
                    </div>

                    {/* Back Button */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                        >
                            ← Back to email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Otp
