import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createMessage, clearError, clearSuccess } from '../../store/slices/contactSlice'
import { fetchUserProfile } from '../../store/slices/authSlice'

const Contact = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(state => state.contact);
  const { user, isAuthenticated } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    subject: '',
    message: ''
  })

  const [validationErrors, setValidationErrors] = useState({});
  const [, setTouched] = useState({});
  const [autoDetected, setAutoDetected] = useState({});

  const applyAutoDetected = (u) => {
    if (!u) return
    const detectedName = u.name || u.fullName || ''
    const detectedEmail = u.email || ''
    const detectedPhone = u.phoneNumber || u.phone || ''

    const updates = {}
    const flags = {}
    if (detectedName) { updates.name = detectedName; flags.name = true }
    if (detectedEmail) { updates.email = detectedEmail; flags.email = true }
    if (detectedPhone) { updates.phoneNumber = detectedPhone; flags.phoneNumber = true }

    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }))
      setAutoDetected(prev => ({ ...prev, ...flags }))
    }
  }

  useEffect(() => {
    // Instant fill from localStorage cache while the profile request is in flight
    applyAutoDetected({
      name: localStorage.getItem('userName') || '',
      email: localStorage.getItem('userEmail') || ''
    })
    if ((isAuthenticated || localStorage.getItem('token') || localStorage.getItem('authToken')) && !user) {
      dispatch(fetchUserProfile())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user) applyAutoDetected(user)
  }, [user])

  // Clear any previous messages when component mounts
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccess());
  }, [dispatch]);

  // Handle success/error states
  useEffect(() => {
    if (success) {
      setFormData({
        name: autoDetected.name ? formData.name : '',
        email: autoDetected.email ? formData.email : '',
        phoneNumber: autoDetected.phoneNumber ? formData.phoneNumber : '',
        subject: '',
        message: ''
      });
      setValidationErrors({});
      setTouched({});
      // Clear success after 5 seconds
      setTimeout(() => {
        dispatch(clearSuccess());
      }, 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Special handling for phone number - only allow digits, +, -, (, ), and spaces
    if (name === 'phoneNumber') {
      const cleanedValue = value.replace(/[^\d+\-()\s]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleanedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }

  const handleBlur = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
    
    // Validate field on blur
    const errors = validateForm();
    if (errors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: errors[fieldName]
      }));
    }
  }

  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's empty
    if (!cleanPhone) {
      return 'Phone number is required';
    }
    
    // Check length (should be 10 digits for Indian numbers or 10-15 for international)
    if (cleanPhone.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    
    if (cleanPhone.length > 15) {
      return 'Phone number cannot exceed 15 digits';
    }
    
    // Check for Indian mobile number pattern (starts with 6, 7, 8, or 9)
    if (cleanPhone.length === 10 && !/^[6-9]/.test(cleanPhone)) {
      return 'Invalid Indian mobile number format';
    }
    
    return '';
  };

  const validateForm = () => {
    const errors = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      errors.name = 'Name can only contain letters and spaces';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) {
      errors.phoneNumber = phoneError;
    }
    
    // Subject validation
    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters';
    }
    
    // Message validation
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phoneNumber: true,
      subject: true,
      message: true
    });
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      await dispatch(createMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      })).unwrap();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  const getFieldIcon = (fieldName, hasError, hasValue) => {
    const baseClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200";
    const colorClasses = hasError 
      ? "text-red-500" 
      : hasValue 
        ? "text-green-500" 
        : "text-gray-400";

    const icons = {
      name: (
        <svg className={`${baseClasses} ${colorClasses}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      email: (
        <svg className={`${baseClasses} ${colorClasses}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      ),
      phoneNumber: (
        <svg className={`${baseClasses} ${colorClasses}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      subject: (
        <svg className={`${baseClasses} ${colorClasses}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      message: (
        <svg className={`${baseClasses} ${colorClasses} top-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    };

    return icons[fieldName];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#E72744] to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Get In Touch
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/85 max-w-3xl mx-auto leading-relaxed">
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form Section */}
          <div className="max-w-3xl mx-auto">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Send us a Message
                </h2>
                <p className="text-base sm:text-lg text-gray-600">
                  Fill out the form below and we'll get back to you within 24 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Name and Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      {getFieldIcon('name', !!validationErrors.name, !!formData.name)}
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('name')}
                        required
                        readOnly={autoDetected.name}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E72744] focus:border-transparent transition-all duration-200 ${
                          validationErrors.name ? 'border-red-500' : 'border-gray-300'
                        } ${autoDetected.name ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                        placeholder="Your full name"
                      />
                    </div>
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                    {autoDetected.name && (
                      <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Auto-detected from your account
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      {getFieldIcon('email', !!validationErrors.email, !!formData.email)}
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('email')}
                        required
                        readOnly={autoDetected.email}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E72744] focus:border-transparent transition-all duration-200 ${
                          validationErrors.email ? 'border-red-500' : 'border-gray-300'
                        } ${autoDetected.email ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                    {autoDetected.email && (
                      <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Auto-detected from your account
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    {getFieldIcon('phoneNumber', !!validationErrors.phoneNumber, !!formData.phoneNumber)}
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('phoneNumber')}
                      required
                      readOnly={autoDetected.phoneNumber}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E72744] focus:border-transparent transition-all duration-200 ${
                        validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                      } ${autoDetected.phoneNumber ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {validationErrors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
                  )}
                  {autoDetected.phoneNumber && (
                    <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Auto-detected from your account
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <div className="relative">
                    {getFieldIcon('subject', !!validationErrors.subject, !!formData.subject)}
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('subject')}
                      required
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E72744] focus:border-transparent transition-all duration-200 ${
                        validationErrors.subject ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="What is this regarding?"
                    />
                  </div>
                  {validationErrors.subject && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.subject}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message *
                  </label>
                  <div className="relative">
                    {getFieldIcon('message', !!validationErrors.message, !!formData.message)}
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('message')}
                      required
                      rows={5}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E72744] focus:border-transparent transition-all duration-200 resize-none ${
                        validationErrors.message ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Tell us about your project or question..."
                    ></textarea>
                  </div>
                  {validationErrors.message && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                      loading 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-[#E72744] hover:bg-[#C81E38] transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                  
                  {success && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
                      Message sent successfully! We'll get back to you soon.
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
                      {error}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
    </div>
  )
}

export default Contact