import axios from '../../utils/api'
import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { backendUrl } from '../../config'
import { User, Phone, CheckCircle, Loader2 } from 'lucide-react'

const CompleteProfile = () => {
    const [name, setName] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const location = useLocation()

    const returnUrl = location.state?.returnUrl || '/'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!name.trim()) {
            setError('Please enter your name')
            return
        }

        if (name.trim().length < 2) {
            setError('Name must be at least 2 characters')
            return
        }

        if (phoneNumber && !/^[6-9]\d{9}$/.test(phoneNumber)) {
            setError('Please enter a valid 10-digit phone number')
            return
        }

        setLoading(true)

        try {
            const response = await axios.put(`${backendUrl}/api/users/complete-profile`, {
                name: name.trim(),
                phoneNumber: phoneNumber || undefined
            })

            if (response.data?.success) {
                const user = response.data.user
                localStorage.setItem('userName', user.name)
                if (user.phoneNumber) localStorage.setItem('userPhone', user.phoneNumber)
                localStorage.setItem('profileCompleted', 'true')

                window.dispatchEvent(new Event('auth-change'))
                window.dispatchEvent(new Event('username-updated'))

                navigate(returnUrl, { replace: true })
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save profile. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleSkip = () => {
        navigate(returnUrl, { replace: true })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-white to-[#FFF1F3] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-r from-[#E72744] to-black rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                        Tell us a bit about yourself to get started
                    </p>
                </div>

                {/* Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                    placeholder="Enter your full name"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number <span className="text-gray-400">(optional)</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                        setPhoneNumber(val)
                                    }}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                                    placeholder="10-digit phone number"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-[#E72744] to-black hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    Saving...
                                </div>
                            ) : (
                                'Continue'
                            )}
                        </button>
                    </form>

                    {/* Skip */}
                    <div className="text-center">
                        <button
                            onClick={handleSkip}
                            disabled={loading}
                            className="text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>

                {/* Info */}
                <p className="text-center text-xs text-gray-500">
                    You can always update your profile later from settings.
                </p>
            </div>
        </div>
    )
}

export default CompleteProfile
