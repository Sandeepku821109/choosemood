import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../../App'
import { useNavigate } from 'react-router-dom'
import { processImageUrl, handleImageError } from '../../utils/imageUtils'

const Profile = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        profilePicture: ""
    })
    
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [updateLoading, setUpdateLoading] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [previewImage, setPreviewImage] = useState(null)
    const navigate = useNavigate()

    // Normalize localStorage presence into explicit "true" flags
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

    // Helper to ensure flags exist whenever component mounts or user data changes
    useEffect(() => {
      normalizeLocalStorageFlags()
    }, [])

    useEffect(() => {
        checkAuthentication()
    }, [])
    
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserProfile()
        }
    }, [isAuthenticated])

    const checkAuthentication = () => {
        try {
            const authToken = localStorage.getItem('authToken')
            const token = localStorage.getItem('token')
            const userEmail = localStorage.getItem('userEmail')

            if (authToken || token || userEmail) {
                setIsAuthenticated(true)
            } else {
                setIsAuthenticated(false)
                navigate('/login')
            }
        } catch (error) {
            console.error('Authentication check failed:', error)
            setIsAuthenticated(false)
            navigate('/login')
        } finally {
            setLoading(false)
        }
    }

    const getAuthHeaders = () => {
        const authToken = localStorage.getItem('authToken')
        const token = localStorage.getItem('token')
        const userEmail = localStorage.getItem('userEmail')

        const headers = {}
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

    // Update the fetchUserProfile function
    const fetchUserProfile = async () => {
        try {
            const headers = getAuthHeaders()
            const response = await axios.get(`${backendUrl}/api/users/profile`, { headers })
            console.log('📝 Profile data:', response.data)
            
            const userData = response.data.data || response.data.user || response.data
            
            if (!userData) {
                throw new Error('No user data received')
            }
            
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phoneNumber || userData.phone || '',
                profilePicture: userData.profilePicture || ''
            })
            
            // Store user name in localStorage for navbar access
            if (userData.name) {
                localStorage.setItem('userName', userData.name)
                // ensure normalized flags updated when profile fetched
                normalizeLocalStorageFlags()
                // Trigger navbar update
                window.dispatchEvent(new Event('auth-change'))
            }
        } catch (error) {
            console.error('❌ Error fetching user profile:', error)
            // Instead of using dummy data, redirect to login
            setIsAuthenticated(false)
            navigate('/login')
        }
    }
    
    const handleInputChange = (e) => {
        const { name, value } = e.target
        
        // Prevent email changes
        if (name === 'email') {
            return
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
            if (!validTypes.includes(file.type)) {
                setMessage({ 
                    type: 'error', 
                    text: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)' 
                })
                return
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024 // 5MB in bytes
            if (file.size > maxSize) {
                setMessage({ 
                    type: 'error', 
                    text: 'Image size must be less than 5MB' 
                })
                return
            }

            const reader = new FileReader()
            reader.onloadend = () => {
                setPreviewImage(reader.result)
                setFormData(prev => ({
                    ...prev,
                    profilePicture: reader.result
                }))
            }
            reader.onerror = () => {
                setMessage({ 
                    type: 'error', 
                    text: 'Failed to read the image file' 
                })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setUpdateLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const headers = getAuthHeaders()
            
            // Exclude email from update payload — backend expects phoneNumber
            const updateData = {
                name: formData.name,
                phoneNumber: formData.phone,
                profilePicture: formData.profilePicture
            }
            
            await axios.put(`${backendUrl}/api/users/profile/update`, updateData, { headers })
            
            // Update localStorage with new name
            if (formData.name) {
                localStorage.setItem('userName', formData.name)
                // keep normalized flags consistent
                normalizeLocalStorageFlags()
            }
            
            setIsEditing(false)
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
            
            // Trigger a storage event to update navbar
            window.dispatchEvent(new Event('storage'))
        } catch (error) {
            console.error('Error updating profile:', error)
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
        } finally {
            setUpdateLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('authToken')
        localStorage.removeItem('token')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userName')
        // remove helper flags as well
        localStorage.removeItem('hasAuthToken')
        localStorage.removeItem('hasToken')
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('hasRazorpayId')
        navigate('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E72744] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E72744] to-purple-700 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl font-bold mb-2">My Profile</h1>
                        <p className="text-white/85">Manage your account information</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Message */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.type === 'success' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-8">
                        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                            {/* Profile Picture */}
                            <div className="relative">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                                    {(previewImage || formData.profilePicture) ? (
                                        <img 
                                            src={processImageUrl(previewImage || formData.profilePicture, formData.name || 'User')} 
                                            alt="Profile" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => handleImageError(e, formData.name || 'User')}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#FFE0E5]">
                                            <span className="text-2xl sm:text-3xl font-bold text-[#E72744]">
                                                {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-[#E72744] text-white p-2 rounded-full cursor-pointer hover:bg-[#C81E38] transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* User Info */}
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    {formData.name || 'User'}
                                </h2>
                                <p className="text-gray-600 text-sm sm:text-base">{formData.email}</p>
                                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                    Member since 2023
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3 sm:ml-auto">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="px-4 py-2 bg-[#E72744] text-white rounded-lg hover:bg-[#C81E38] transition-colors text-sm font-medium"
                                >
                                    {isEditing ? 'Cancel' : 'Edit Profile'}
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <div className="p-6 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E72744] transition-all ${
                                        isEditing 
                                            ? 'border-gray-300 bg-white' 
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                    <span className="text-xs text-gray-500 ml-2">(Cannot be changed)</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    disabled={true}
                                    className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg focus:outline-none text-gray-600 cursor-not-allowed"
                                    placeholder="Enter your email address"
                                />
                            </div>

                            {/* Phone Field */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E72744] transition-all ${
                                        isEditing 
                                            ? 'border-gray-300 bg-white' 
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                    placeholder="Enter your phone number"
                                />
                            </div>

                            {/* Submit Button */}
                            {isEditing && (
                                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false)
                                            setPreviewImage(null)
                                            fetchUserProfile() // Reset form data
                                        }}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updateLoading}
                                        className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
                                            updateLoading 
                                                ? 'bg-blue-400 cursor-not-allowed' 
                                                : 'bg-[#E72744] hover:bg-[#C81E38] transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl'
                                        }`}
                                    >
                                        {updateLoading ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0c4.42 0 8 3.58 8 8h-4a4 4 0 00-4-4 4 4 0 00-4 4h-4z"></path>
                                                </svg>
                                                Updating...
                                            </span>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
