import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { backendUrl } from '../../config'

const RIDER_TOKEN_KEY = 'riderToken'

export const riderLogin = createAsyncThunk(
  'rider/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/riders/login`, credentials)
      if (response.data?.token) {
        localStorage.setItem(RIDER_TOKEN_KEY, response.data.token)
      }
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Rider login failed' })
    }
  }
)

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem(RIDER_TOKEN_KEY)}`
})

export const fetchRiderOrders = createAsyncThunk(
  'rider/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/riders/orders`, { headers: authHeader() })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not load orders' })
    }
  }
)

export const startDelivery = createAsyncThunk(
  'rider/startDelivery',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/riders/orders/${orderId}/out-for-delivery`,
        {},
        { headers: authHeader() }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not start delivery' })
    }
  }
)

export const completeDelivery = createAsyncThunk(
  'rider/completeDelivery',
  async ({ orderId, otp, signature }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/riders/orders/${orderId}/complete-delivery`,
        { otp, signature },
        { headers: authHeader() }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not complete delivery' })
    }
  }
)

export const reportDeliveryFailure = createAsyncThunk(
  'rider/reportFailure',
  async ({ orderId, reason }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/riders/orders/${orderId}/delivery-failed`,
        { reason },
        { headers: authHeader() }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Could not record failure' })
    }
  }
)

const initialState = {
  token: localStorage.getItem(RIDER_TOKEN_KEY) || null,
  rider: null,
  orders: [],
  loading: false,
  actionLoading: false,
  error: null
}

const riderSlice = createSlice({
  name: 'rider',
  initialState,
  reducers: {
    riderLogout(state) {
      localStorage.removeItem(RIDER_TOKEN_KEY)
      state.token = null
      state.rider = null
      state.orders = []
      state.error = null
    },
    clearRiderError(state) {
      state.error = null
    },
    restoreRiderSession(state, action) {
      state.rider = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(riderLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(riderLogin.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.rider = action.payload.rider
      })
      .addCase(riderLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Login failed'
      })
      .addCase(fetchRiderOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRiderOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.orders || []
      })
      .addCase(fetchRiderOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.message || 'Could not load orders'
      })
      .addCase(startDelivery.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(startDelivery.fulfilled, (state) => {
        state.actionLoading = false
      })
      .addCase(startDelivery.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload?.message
      })
      .addCase(completeDelivery.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(completeDelivery.fulfilled, (state) => {
        state.actionLoading = false
      })
      .addCase(completeDelivery.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload?.message
      })
      .addCase(reportDeliveryFailure.pending, (state) => {
        state.actionLoading = true
      })
      .addCase(reportDeliveryFailure.fulfilled, (state) => {
        state.actionLoading = false
      })
      .addCase(reportDeliveryFailure.rejected, (state, action) => {
        state.actionLoading = false
        state.error = action.payload?.message
      })
  }
})

export const { riderLogout, clearRiderError, restoreRiderSession } = riderSlice.actions

export default riderSlice.reducer
