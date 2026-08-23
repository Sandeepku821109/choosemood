import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { backendUrl } from '../../App'

// Normalize localStorage presence into explicit "true" flags
const normalizeLocalStorageFlags = () => {
  try {
    if (localStorage.getItem('token')) localStorage.setItem('hasToken', 'true')
    if (localStorage.getItem('authToken')) localStorage.setItem('hasAuthToken', 'true')
    if (localStorage.getItem('userId') || localStorage.getItem('userEmail')) localStorage.setItem('isLoggedIn', 'true')
    if (localStorage.getItem('razorpayid') || localStorage.getItem('razorpayOrderId') || localStorage.getItem('razorpay_order_id')) {
      localStorage.setItem('hasRazorpayId', 'true')
    }
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

// ensure flags exist at module load
normalizeLocalStorageFlags()

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/users/login`, credentials)
      // persist token and flags
      if (response?.data?.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('hasToken', 'true')
        localStorage.setItem('isLoggedIn', 'true')
      }
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Login failed' })
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/users/signup`, userData)
      if (response?.data?.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('hasToken', 'true')
        localStorage.setItem('isLoggedIn', 'true')
      }
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed' })
    }
  }
)

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      if (!token) return null

      const response = await axios.get(`${backendUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // ensure flags reflect that profile fetched / logged in
      localStorage.setItem('isLoggedIn', 'true')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch profile' })
    }
  }
)

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  // prefer explicit flag if present
  isAuthenticated: getLocalBoolean('hasToken') || !!localStorage.getItem('token'),
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      // clear auth data and flags
      localStorage.removeItem('token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('hasToken')
      localStorage.removeItem('hasAuthToken')
      localStorage.removeItem('isLoggedIn')
      // keep other localStorage values untouched
      state.user = null
      state.token = null
      state.isAuthenticated = false
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Login reducers
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload?.token || localStorage.getItem('token')
        state.user = action.payload?.user || null
        // ensure flags exist
        try {
          if (state.token) localStorage.setItem('hasToken', 'true')
          if (state.user) localStorage.setItem('isLoggedIn', 'true')
        } catch (e) { /* noop */ }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || action.payload || 'Login failed'
      })
      // Register reducers
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload?.token || localStorage.getItem('token')
        state.user = action.payload?.user || null
        try {
          if (state.token) localStorage.setItem('hasToken', 'true')
          if (state.user) localStorage.setItem('isLoggedIn', 'true')
        } catch (e) { /* noop */ }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || action.payload || 'Registration failed'
      })
      // Fetch profile reducers
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.user = action.payload
          try { localStorage.setItem('isLoggedIn', 'true') } catch (e) { /* noop */ }
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Failed to fetch profile'
      })
  }
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
