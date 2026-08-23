import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Mail,
  Loader2,
  Home,
  X
} from 'lucide-react'
import BrandLoader from './common/BrandLoader'
import { 
  fetchAddress, 
  createAddress, 
  updateAddress, 
  deleteAddress,
  setSelectedAddress,
  clearError 
} from '../store/slices/addressSlice'

const EMPTY_FORM = {
  fullName: '',
  email: '',
  phoneNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
  addressType: 'home',
  isDefault: false
}

const AddressModal = ({ onClose, onSave, initialData, loading }) => {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(initialData ? {
      fullName: initialData.fullName || '',
      email: initialData.email || '',
      phoneNumber: initialData.phoneNumber || '',
      addressLine1: initialData.addressLine1 || '',
      addressLine2: initialData.addressLine2 || '',
      city: initialData.city || '',
      state: initialData.state || '',
      pincode: initialData.pincode || '',
      landmark: initialData.landmark || '',
      addressType: initialData.type || 'home',
      isDefault: !!initialData.isDefault
    } : {})
  }))
  const [formError, setFormError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    if (!form.fullName.trim()) return setFormError('Full name is required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setFormError('A valid email is required')
    if (!/^[6-9]\d{9}$/.test(form.phoneNumber.trim())) return setFormError('Enter a valid 10-digit mobile number')
    if (!form.addressLine1.trim()) return setFormError('Address line 1 is required')
    if (!form.city.trim()) return setFormError('City is required')
    if (!/^\d{6}$/.test(form.pincode.trim())) return setFormError('Enter a valid 6-digit pincode')

    onSave({
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      landmark: form.landmark.trim()
    })
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#E72744]"
  const labelClass = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input name="fullName" value={form.fullName} onChange={handleChange} className={inputClass} placeholder="John Doe" />
            </div>
            <div>
              <label className={labelClass}>Phone Number *</label>
              <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} maxLength={10} inputMode="numeric" className={inputClass} placeholder="9876543210" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="john@example.com" />
          </div>

          <div>
            <label className={labelClass}>Address Line 1 *</label>
            <input name="addressLine1" value={form.addressLine1} onChange={handleChange} className={inputClass} placeholder="House no, building, street" />
          </div>

          <div>
            <label className={labelClass}>Address Line 2</label>
            <input name="addressLine2" value={form.addressLine2} onChange={handleChange} className={inputClass} placeholder="Area, colony (optional)" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>City *</label>
              <input name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="City" />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input name="state" value={form.state} onChange={handleChange} className={inputClass} placeholder="State" />
            </div>
            <div>
              <label className={labelClass}>Pincode *</label>
              <input name="pincode" value={form.pincode} onChange={handleChange} maxLength={6} inputMode="numeric" className={inputClass} placeholder="110001" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Landmark</label>
            <input name="landmark" value={form.landmark} onChange={handleChange} className={inputClass} placeholder="Near... (optional)" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelClass}>Address Type</label>
              <select name="addressType" value={form.addressType} onChange={handleChange} className={inputClass}>
                <option value="home">Home</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2 cursor-pointer">
              <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} className="w-4 h-4 accent-[#E72744]" />
              Set as default address
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-[#E72744] text-white text-sm font-medium hover:bg-[#C81E38] disabled:opacity-60 flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {initialData ? 'Save Changes' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Address = () => {
  const dispatch = useDispatch()
  const { addresses, loading, error, selectedAddress } = useSelector(state => state.address)
  
  const [showModal, setShowModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    dispatch(fetchAddress())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      setMessage({ type: 'error', text: error })
      // Clear error after showing it
      setTimeout(() => {
        dispatch(clearError())
        setMessage({ type: '', text: '' })
      }, 5000)
    }
  }, [error, dispatch])

  const handleAddAddress = () => {
    setEditingAddress(null)
    setShowModal(true)
  }

  const handleEditAddress = (address) => {
    setEditingAddress(address)
    setShowModal(true)
  }

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return
    }

    try {
      await dispatch(deleteAddress(addressId)).unwrap()
      setMessage({ type: 'success', text: 'Address deleted successfully!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete address' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleSaveAddress = async (addressData) => {
    try {
      if (editingAddress) {
        await dispatch(updateAddress({ ...addressData, _id: editingAddress._id })).unwrap()
        setMessage({ type: 'success', text: 'Address updated successfully!' })
      } else {
        await dispatch(createAddress(addressData)).unwrap()
        setMessage({ type: 'success', text: 'Address added successfully!' })
      }
      setShowModal(false)
      setEditingAddress(null)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save address' })
    }
  }

  const handleSetDefault = (address) => {
    dispatch(setSelectedAddress(address))
  }

  if (loading && addresses.length === 0) {
    return <BrandLoader label="Loading addresses" fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Home className="w-8 h-8" />
            My Addresses
          </h1>
          <p className="text-gray-600 mt-2">Manage your delivery addresses</p>
        </div>

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

        {/* Add Address Button */}
        <div className="mb-6">
          <button 
            onClick={handleAddAddress}
            className="flex items-center gap-2 px-6 py-3 bg-[#E72744] text-white rounded-lg hover:bg-[#C81E38] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Address
          </button>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No addresses found</h3>
            <p className="text-gray-600 mb-6">Add your first delivery address to get started</p>
            <button 
              onClick={handleAddAddress}
              className="px-6 py-3 bg-[#E72744] text-white rounded-lg hover:bg-[#C81E38] transition-colors"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address) => (
              <div 
                key={address._id || address.id} 
                className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
                  selectedAddress?._id === address._id ? 'border-[#E72744] ring-2 ring-blue-200' : 'border-gray-200'
                }`}
              >
                {/* Address Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">{address.fullName}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {address.isDefault && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                    {selectedAddress?._id === address._id && (
                      <span className="inline-flex items-center px-2 py-1 bg-[#FFE0E5] text-[#AE1830] text-xs font-medium rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                </div>

                {/* Address Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-700">
                        {address.addressLine1}
                      </p>
                      {address.addressLine2 && (
                        <p>{address.addressLine2}</p>
                      )}
                      <p>{address.city}, {address.state} {address.pincode}</p>
                      <p>{address.country || 'India'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{address.phoneNumber}</span>
                  </div>

                  {address.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{address.email}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditAddress(address)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#E72744] hover:bg-[#FFF1F3] rounded-md transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteAddress(address._id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                  {selectedAddress?._id !== address._id && (
                    <button
                      onClick={() => handleSetDefault(address)}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Address Modal */}
        {showModal && (
          <AddressModal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setEditingAddress(null)
            }}
            onSave={handleSaveAddress}
            initialData={editingAddress}
            loading={loading}
          />
        )}
      </div>
    </div>
  )
}

export default Address