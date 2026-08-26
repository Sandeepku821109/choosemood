import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { backendUrl } from '../../config'

// ---------------------------------------------------------------------------
// Normalize localStorage presence flags (kept for backwards compat)
// ---------------------------------------------------------------------------
const normalizeLocalStorageFlags = () => {
  try {
    if (localStorage.getItem('token')) localStorage.setItem('hasToken', 'true')
    if (localStorage.getItem('authToken')) localStorage.setItem('hasAuthToken', 'true')
    if (localStorage.getItem('userId') || localStorage.getItem('userEmail')) localStorage.setItem('isLoggedIn', 'true')
  } catch (e) {
    console.debug('normalizeLocalStorageFlags error', e)
  }
}

normalizeLocalStorageFlags()

// ---------------------------------------------------------------------------
// Async thunks
// ---------------------------------------------------------------------------

// Check if the httpOnly cookie session is still valid
export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/users/session`)
      localStorage.setItem('isLoggedIn', 'true')
      if (response.data?.user) {
        if (response.data.user.id) localStorage.setItem('userId', response.data.user.id)
        if (response.data.user.email) localStorage.setItem('userEmail', response.data.user.email)
      }
      normalizeLocalStorageFlags()
      return response.data
    } catch (error) {
      // Session invalid — clear stale localStorage
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('hasToken')
      localStorage.removeItem('hasAuthToken')
      return rejectWithValue(error.response?.data || { message: 'Session expired' })
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/users/login`, credentials)
      if (response?.data?.token) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('hasToken', 'true')
        localStorage.setItem('isLoggedIn', 'true')
        if (response.data.user?.id) localStorage.setItem('userId', response.data.user.id)
        if (response.data.user?.email) localStorage.setItem('userEmail', response.data.user.email)
      }
      normalizeLocalStorageFlags()
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
      const response = await axios.get(`${backendUrl}/api/users/profile`)
      localStorage.setItem('isLoggedIn', 'true')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch profile' })
    }
  }
)

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token')
      localStorage.removeItem('authToken')
      localStorage.removeItem('hasToken')
      localStorage.removeItem('hasAuthToken')
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userId')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userName')
      state.user = null
      state.token = null
      state.isAuthenticated = false
      // Fire-and-forget: clear httpOnly cookie on backend
      axios.post(`${backendUrl}/api/users/logout`).catch(() => {})
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Check session
      .addCase(checkSession.pending, (state) => {
        state.loading = true
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload?.user || null
        state.token = localStorage.getItem('token')
      })
      .addCase(checkSession.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload?.token || localStorage.getItem('token')
        state.user = action.payload?.user || null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Login failed'
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Registration failed'
      })
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.user = action.payload.user || action.payload
          state.isAuthenticated = true
        }
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.loading = false
      })
  }
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
