import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { backendUrl } from "../../App";
import axios from "axios";

// Normalize certain localStorage presence into explicit "true" flags
const normalizeLocalStorageFlags = () => {
  try {
    if (localStorage.getItem('authToken')) localStorage.setItem('hasAuthToken', 'true')
    if (localStorage.getItem('token')) localStorage.setItem('hasToken', 'true')
    if (localStorage.getItem('razorpayid') || localStorage.getItem('razorpayOrderId') || localStorage.getItem('razorpay_order_id')) {
      localStorage.setItem('hasRazorpayId', 'true')
    }
    if (localStorage.getItem('userId') || localStorage.getItem('userEmail')) localStorage.setItem('isLoggedIn', 'true')
  } catch (e) {
    console.debug('normalizeLocalStorageFlags error', e)
  }
}

const getLocalBoolean = (key) => {
  try {
    return String(localStorage.getItem(key)).toLowerCase() === 'true'
  } catch (e) {
    return false
  }
}

// run normalization once at module load
normalizeLocalStorageFlags()

// Helper function to check if user is authenticated
const checkUserAuthentication = () => {
  // prefer the actual token values, but fall back to boolean flags for quick checks
  const authToken = localStorage.getItem('authToken') || null
  const token = localStorage.getItem('token') || null
  const userId = getStoredUserId()
  const userEmail = localStorage.getItem('userEmail') || null

  // boolean flags (set by normalizeLocalStorageFlags)
  const hasAuthTokenFlag = getLocalBoolean('hasAuthToken')
  const hasTokenFlag = getLocalBoolean('hasToken')
  const isLoggedInFlag = getLocalBoolean('isLoggedIn')

  console.log('🔐 Authentication Check:', {
    hasAuthTokenFlag,
    hasTokenFlag,
    isLoggedInFlag,
    authTokenPresent: !!authToken,
    tokenPresent: !!token,
    userId,
    userEmail
  });

  const hasValidToken = !!(authToken || token || hasAuthTokenFlag || hasTokenFlag)
  const hasUserInfo = !!(userId || userEmail || isLoggedInFlag)

  return {
    isAuthenticated: hasValidToken,
    token: authToken || token || null,
    userId,
    userEmail,
    hasValidToken,
    hasUserInfo
  }
}

// Helper function to get authentication headers
const getAuthHeaders = () => {
  const authCheck = checkUserAuthentication()
  
  if (!authCheck.isAuthenticated) {
    console.warn('⚠️ User not authenticated - missing token');
    throw new Error('User authentication required. Please login again.');
  }

  const headers = {
    'Content-Type': 'application/json'
  }

  // Add authorization header (this is required)
  if (authCheck.token) {
    headers.Authorization = `Bearer ${authCheck.token}`
  }

  // Add user identification headers if available (optional)
  if (authCheck.userEmail) {
    headers['User-Email'] = authCheck.userEmail
  }

  if (authCheck.userId) {
    headers['User-ID'] = authCheck.userId
  }

  console.log('📤 Request Headers:', {
    hasAuthorization: !!headers.Authorization,
    hasUserEmail: !!headers['User-Email'],
    hasUserId: !!headers['User-ID'],
    Authorization: headers.Authorization ? `Bearer ${headers.Authorization.substring(7, 17)}...` : 'none'
  });
  
  return headers
}

const fetchAddress = createAsyncThunk(
    'address/fetchAddress',
    async (_, { rejectWithValue }) => {
        try {
            console.log('🚀 Fetching addresses from:', `${backendUrl}/api/addresses`);
            
            // Check authentication before making request
            const authCheck = checkUserAuthentication()
            if (!authCheck.isAuthenticated) {
                throw new Error('Please login to view your addresses');
            }
            
            const response = await axios.get(`${backendUrl}/api/addresses`, {
                headers: getAuthHeaders(),
                timeout: 10000
            });
            
            console.log('✅ Fetch addresses response:', response.data);
            
            // Handle different response structures
            const addresses = response.data?.data?.addresses || response.data?.addresses || response.data || [];
            console.log('📦 Extracted addresses:', addresses);
            
            return Array.isArray(addresses) ? addresses : [];
        } catch (error) {
            console.error('❌ Fetch addresses error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers
            });
            
            // Handle specific error status codes
            if (error.response?.status === 401) {
                return rejectWithValue('Authentication failed. Please login again.');
            } else if (error.response?.status === 403) {
                return rejectWithValue('Access denied. Please check your permissions.');
            } else if (error.message.includes('login')) {
                return rejectWithValue(error.message);
            } else {
                return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch addresses');
            }
        }
    }
)

const createAddress = createAsyncThunk(
    'address/createAddress',
    async (addressData, { rejectWithValue, getState }) => {
        try {
            console.log('🚀 Creating address with data:', addressData);
            
            // Check authentication first
            const authCheck = checkUserAuthentication()
            if (!authCheck.isAuthenticated) {
                throw new Error('Please login to add an address');
            }
            
            // Validate required fields
            if (!addressData.fullName?.trim()) {
                throw new Error('Full name is required');
            }
            if (!addressData.phoneNumber?.trim()) {
                throw new Error('Phone number is required');
            }
            if (!addressData.addressLine1?.trim()) {
                throw new Error('Address line 1 is required');
            }
            // addressLine2 is optional - remove the validation for it
            if (!addressData.city?.trim()) {
                throw new Error('City is required');
            }
            if (!addressData.pincode?.trim()) {
                throw new Error('Pincode is required');
            }
            
            // Additional pincode format validation
            const pincodeRegex = /^\d{6}$/;
            if (!pincodeRegex.test(addressData.pincode.trim())) {
                throw new Error('Pincode must be a 6-digit number');
            }

            // Additional phone number format validation
            const phoneRegex = /^\d{10}$/;
            const cleanPhone = addressData.phoneNumber.trim().replace(/\D/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                throw new Error('Phone number must be exactly 10 digits');
            }

            const { address: { addresses } } = getState();
            const existingAddressCount = addresses.length;

            // Prepare the address payload with required user information
            const addressPayload = {
                userId: authCheck.userId,
                fullName: addressData.fullName.trim(),
                email: authCheck.Email || addressData.email || '',
                phoneNumber: cleanPhone, // Use cleaned phone number
                addressLine1: addressData.addressLine1.trim(),
                addressLine2: addressData.addressLine2?.trim() || '',
                city: addressData.city.trim(),
                state: addressData.state?.trim() || '',
                pincode: addressData.pincode.trim(),
                landmark: addressData.landmark?.trim() || '',
                type: addressData.addressType || 'home',
                isDefault: existingAddressCount === 0 ? true : (addressData.isDefault || false),
                // Add default country
            };

            console.log('📤 Sending address payload:', addressPayload);
            
            const response = await axios.post(`${backendUrl}/api/addresses`, addressPayload, {
                headers: getAuthHeaders(),
                timeout: 10000 // Add timeout
            });
            
            console.log('✅ Create address response:', response.data);
            
            // Handle different response structures — backend returns { success, message, data: <address> }
            const payloadData = response.data?.data
            const newAddress = payloadData && payloadData._id ? payloadData : (response.data?._id ? response.data : null);
            
            if (!newAddress) {
                throw new Error('Invalid response format from server');
            }
            
            return newAddress;
        } catch (error) {
            console.error('❌ Create address error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                sentData: addressData,
                url: `${backendUrl}/api/addresses`
            });
            
            // Handle specific error status codes
            if (error.response?.status === 500) {
                console.error('🔥 Server Error 500 - Check backend logs');
                return rejectWithValue('Server error occurred. Please try again later or contact support.');
            } else if (error.response?.status === 401) {
                return rejectWithValue('Authentication failed. Please login again.');
            } else if (error.response?.status === 400) {
                return rejectWithValue(error.response.data.message || 'Invalid address data provided.');
            } else if (error.response?.status === 422) {
                return rejectWithValue(error.response.data.message || 'Validation failed. Please check your input.');
            } else if (error.code === 'ECONNABORTED') {
                return rejectWithValue('Request timeout. Please check your internet connection.');
            } else if (error.message.includes('login')) {
                return rejectWithValue(error.message);
            } else if (error.response?.data?.message) {
                return rejectWithValue(error.response.data.message);
            } else if (error.message) {
                return rejectWithValue(error.message);
            } else {
                return rejectWithValue('Failed to create address. Please try again.');
            }
        }
    }
)

const updateAddress = createAsyncThunk(
    'address/updateAddress',
    async (addressData, { rejectWithValue }) => {
        try {
            console.log('🚀 Updating address:', addressData);
            
            // Validate required fields
            if (!addressData._id) {
                throw new Error('Address ID is required for update');
            }
            
            // Get user details from localStorage
            const userId = localStorage.getItem('userId');
            const userEmail = localStorage.getItem('userEmail');
            
            // Prepare the address payload with required user information
            const addressPayload = {
                userId: userId,
                fullName: addressData.fullName?.trim(),
                email: userEmail || addressData.email,
                phoneNumber: addressData.phoneNumber?.trim(),
                addressLine1: addressData.addressLine1?.trim(),
                addressLine2: addressData.addressLine2?.trim() || '',
                city: addressData.city?.trim(),
                state: addressData.state?.trim(),
                pincode: addressData.pincode?.trim(),
                landmark: addressData.landmark?.trim() || '',
                type: addressData.addressType || 'home',
                isDefault: addressData.isDefault || false
            };

            console.log('📤 Updating address payload:', addressPayload);
            
            const response = await axios.put(`${backendUrl}/api/addresses/${addressData._id}`, addressPayload, {
                headers: getAuthHeaders(),
            });
            
            console.log('✅ Update address response:', response.data);
            
            // Handle different response structures — backend returns { success, message, data: <address> }
            const payloadData = response.data?.data
            const updatedAddress = payloadData && payloadData._id ? payloadData : (response.data?._id ? response.data : null);
            
            if (!updatedAddress) {
                throw new Error('Invalid response format from server');
            }
            
            return updatedAddress;
        } catch (error) {
            console.error('❌ Update address error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                sentData: addressData
            });
            
            if (error.response?.data?.message) {
                return rejectWithValue(error.response.data.message);
            } else if (error.message) {
                return rejectWithValue(error.message);
            } else {
                return rejectWithValue('Failed to update address');
            }
        }
    }
)

const deleteAddress = createAsyncThunk(
    'address/deleteAddress',
    async (id, { rejectWithValue }) => {
        try {
            console.log('🚀 Deleting address with ID:', id);
            
            if (!id) {
                throw new Error('Address ID is required for deletion');
            }
            
            const response = await axios.delete(`${backendUrl}/api/addresses/${id}`, {
                headers: getAuthHeaders(),
            });
            
            console.log('✅ Delete address response:', response.data);
            return { data: response.data, deletedId: id };
        } catch (error) {
            console.error('❌ Delete address error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                addressId: id
            });
            
            if (error.response?.data?.message) {
                return rejectWithValue(error.response.data.message);
            } else if (error.message) {
                return rejectWithValue(error.message);
            } else {
                return rejectWithValue('Failed to delete address');
            }
        }
    }
)

// Helper: parse JWT safely
const parseJwt = (token) => {
  try {
    const parts = String(token || '').split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(decodeURIComponent(atob(parts[1]).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')))
    return payload || null
  } catch (e) {
    console.log(e)
    return null
  }
}

// get stored userId or try to read from token payload
const getStoredUserId = () => {
  try {
    const stored = localStorage.getItem('userId')
    if (stored) return stored
    const token = localStorage.getItem('authToken') || localStorage.getItem('token')
    const payload = parseJwt(token)
    // common claim names: sub / id / userId
    return payload?.sub || payload?.id || payload?.userId || null
  } catch (e) {
    return null
  }
}

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        addresses: [],
        loading: false,
        error: null,
        selectedAddress: null,
        creating: false,
        updating: false,
        deleting: false,
    },
    reducers: {
        setSelectedAddress: (state, action) => {
            console.log('🎯 Setting selected address:', action.payload);
            state.selectedAddress = action.payload;
        },
        clearError: (state) => {
            console.log('🧹 Clearing address error');
            state.error = null;
        },
        clearAddresses: (state) => {
            console.log('🧹 Clearing all addresses');
            state.addresses = [];
            state.selectedAddress = null;
        },
        resetAddressState: (state) => {
            console.log('🔄 Resetting address state');
            state.loading = false;
            state.creating = false;
            state.updating = false;
            state.deleting = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch addresses
            .addCase(fetchAddress.pending, (state) => {
                console.log('⏳ Fetch addresses pending...');
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAddress.fulfilled, (state, action) => {
                console.log('✅ Fetch addresses fulfilled:', action.payload);
                state.loading = false;
                state.addresses = Array.isArray(action.payload) ? action.payload : [];
                console.log('📦 Addresses stored in state:', state.addresses);
                
                // Auto-select default address or first address if none is selected
                if (!state.selectedAddress && state.addresses.length > 0) {
                    const defaultAddress = state.addresses.find(addr => addr.isDefault);
                    state.selectedAddress = defaultAddress || state.addresses[0];
                    console.log('🎯 Auto-selected address:', state.selectedAddress);
                }
            })
            .addCase(fetchAddress.rejected, (state, action) => {
                console.error('❌ Fetch addresses rejected:', action.payload);
                state.loading = false;
                state.error = action.payload || 'Failed to fetch addresses';
            })
            // Create address
            .addCase(createAddress.pending, (state) => {
                console.log('⏳ Create address pending...');
                state.creating = true;
                state.error = null;
            })
            .addCase(createAddress.fulfilled, (state, action) => {
                console.log('✅ Create address fulfilled:', action.payload);
                state.creating = false;
                const newAddress = action.payload;
                
                // If this is the first address or marked as default, update other addresses
                if (newAddress.isDefault) {
                    state.addresses.forEach(addr => {
                        addr.isDefault = false;
                    });
                }
                
                state.addresses.push(newAddress);
                
                // Auto-select the new address if it's the first one or marked as default
                if (state.addresses.length === 1 || newAddress.isDefault) {
                    state.selectedAddress = newAddress;
                }
                
                console.log('📦 Updated addresses after create:', state.addresses);
            })
            .addCase(createAddress.rejected, (state, action) => {
                console.error('❌ Create address rejected:', action.payload);
                state.creating = false;
                state.error = action.payload || 'Failed to create address';
            })
            // Update address
            .addCase(updateAddress.pending, (state) => {
                console.log('⏳ Update address pending...');
                state.updating = true;
                state.error = null;
            })
            .addCase(updateAddress.fulfilled, (state, action) => {
                console.log('✅ Update address fulfilled:', action.payload);
                state.updating = false;
                const updatedAddress = action.payload;
                const index = state.addresses.findIndex(addr => addr._id === updatedAddress._id);
                
                if (index !== -1) {
                    // If this address is being set as default, remove default from others
                    if (updatedAddress.isDefault) {
                        state.addresses.forEach(addr => {
                            if (addr._id !== updatedAddress._id) {
                                addr.isDefault = false;
                            }
                        });
                    }
                    
                    state.addresses[index] = updatedAddress;
                    console.log('📦 Updated address at index:', index);
                    
                    // Update selected address if it was the one being updated
                    if (state.selectedAddress && state.selectedAddress._id === updatedAddress._id) {
                        state.selectedAddress = updatedAddress;
                        console.log('🎯 Updated selected address');
                    }
                }
            })
            .addCase(updateAddress.rejected, (state, action) => {
                console.error('❌ Update address rejected:', action.payload);
                state.updating = false;
                state.error = action.payload || 'Failed to update address';
            })
            // Delete address
            .addCase(deleteAddress.pending, (state) => {
                console.log('⏳ Delete address pending...');
                state.deleting = true;
                state.error = null;
            })
            .addCase(deleteAddress.fulfilled, (state, action) => {
                console.log('✅ Delete address fulfilled:', action.payload);
                state.deleting = false;
                const deletedId = action.payload.deletedId || action.meta.arg;
                const beforeCount = state.addresses.length;
                
                state.addresses = state.addresses.filter(addr => addr._id !== deletedId);
                console.log(`📦 Addresses after delete: ${beforeCount} -> ${state.addresses.length}`);
                
                // If deleted address was selected, select another one
                if (state.selectedAddress && state.selectedAddress._id === deletedId) {
                    if (state.addresses.length > 0) {
                        const defaultAddress = state.addresses.find(addr => addr.isDefault);
                        state.selectedAddress = defaultAddress || state.addresses[0];
                        console.log('🎯 Selected new address after deletion:', state.selectedAddress);
                    } else {
                        state.selectedAddress = null;
                        console.log('🎯 Cleared selected address (no more addresses)');
                    }
                }
            })
            .addCase(deleteAddress.rejected, (state, action) => {
                console.error('❌ Delete address rejected:', action.payload);
                state.deleting = false;
                state.error = action.payload || 'Failed to delete address';
            });
    },
});

export const { setSelectedAddress, clearError, clearAddresses, resetAddressState } = addressSlice.actions;
export { fetchAddress, createAddress, updateAddress, deleteAddress };
export default addressSlice.reducer;