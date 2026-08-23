import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { backendUrl } from '../../App'

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

// Fetch wallet balance + transactions
export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/wallet`, { headers: getAuthHeaders() })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet')
    }
  }
)

// Step 1: Create Razorpay order for adding money
export const createTopupOrder = createAsyncThunk(
  'wallet/createTopupOrder',
  async (amount, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/wallet/topup/create-order`,
        { amount },
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create top-up order')
    }
  }
)

// Step 2: Verify payment and credit wallet
export const verifyTopup = createAsyncThunk(
  'wallet/verifyTopup',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/wallet/topup/verify`,
        paymentData,
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment verification failed')
    }
  }
)

// Spin game: fetch eligibility + active coupons
export const fetchSpinStatus = createAsyncThunk(
  'wallet/fetchSpinStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/wallet/spin/status`, { headers: getAuthHeaders() })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch spin status')
    }
  }
)

// Spin game: play once per day
export const playSpinGame = createAsyncThunk(
  'wallet/playSpinGame',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendUrl}/api/wallet/spin/play`, {}, { headers: getAuthHeaders() })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to spin')
    }
  }
)

// Free delivery coupon: validate at checkout (preview)
export const validateSpinCoupon = createAsyncThunk(
  'wallet/validateSpinCoupon',
  async (code, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/wallet/spin/validate-coupon`,
        { code },
        { headers: getAuthHeaders() }
      )
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid coupon')
    }
  }
)

const initialState = {
  balance: 0,
  currency: 'INR',
  totalAdded: 0,
  totalSpent: 0,
  transactions: [],
  loading: false,
  error: null,
  topupLoading: false,
  verifying: false,
  // Spin game state
  spin: {
    canPlay: false,
    lastPlayedAt: null,
    nextPlayInMs: 0,
    wheel: null,
    activeRewards: [],
    spinning: false,
    result: null
  }
}

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null
    },
    resetWallet: () => initialState,
    clearSpinResult: (state) => {
      state.spin.result = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false
        state.balance = Number(action.payload?.balance) || 0
        state.currency = action.payload?.currency || 'INR'
        state.totalAdded = Number(action.payload?.totalAdded) || 0
        state.totalSpent = Number(action.payload?.totalSpent) || 0
        state.transactions = action.payload?.transactions || []
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createTopupOrder.pending, (state) => {
        state.topupLoading = true
        state.error = null
      })
      .addCase(createTopupOrder.fulfilled, (state) => {
        state.topupLoading = false
      })
      .addCase(createTopupOrder.rejected, (state, action) => {
        state.topupLoading = false
        state.error = action.payload
      })
      .addCase(verifyTopup.pending, (state) => {
        state.verifying = true
      })
      .addCase(verifyTopup.fulfilled, (state, action) => {
        state.verifying = false
        if (action.payload?.data?.balance !== undefined) {
          state.balance = Number(action.payload.data.balance)
        }
      })
      .addCase(verifyTopup.rejected, (state, action) => {
        state.verifying = false
        state.error = action.payload
      })
      // ---- Spin game ----
      .addCase(fetchSpinStatus.pending, (state) => {
        state.error = null
      })
      .addCase(fetchSpinStatus.fulfilled, (state, action) => {
        state.spin.canPlay = !!action.payload?.canPlay
        state.spin.lastPlayedAt = action.payload?.lastPlayedAt || null
        state.spin.nextPlayInMs = Number(action.payload?.nextPlayInMs) || 0
        state.spin.wheel = action.payload?.wheel || null
        state.spin.activeRewards = action.payload?.activeRewards || []
      })
      .addCase(fetchSpinStatus.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(playSpinGame.pending, (state) => {
        state.spin.spinning = true
        state.spin.result = null
        state.error = null
      })
      .addCase(playSpinGame.fulfilled, (state, action) => {
        state.spin.spinning = false
        state.spin.result = action.payload?.data || null
        state.spin.canPlay = false
        if (action.payload?.data?.balance !== undefined) {
          state.balance = Number(action.payload.data.balance)
        }
      })
      .addCase(playSpinGame.rejected, (state, action) => {
        state.spin.spinning = false
        state.error = action.payload
      })
  }
})

export const { clearWalletError, resetWallet, clearSpinResult } = walletSlice.actions

export default walletSlice.reducer
