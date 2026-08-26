import axios from 'axios'
import { backendUrl } from '../config'

// ---------------------------------------------------------------------------
// Axios defaults — every request carries the httpOnly cookie automatically.
// The backend also accepts Bearer headers as fallback (phone-auth, rider).
// ---------------------------------------------------------------------------
axios.defaults.baseURL = backendUrl
axios.defaults.withCredentials = true

// ---------------------------------------------------------------------------
// Auth-related localStorage keys wiped on logout / session expiry
// ---------------------------------------------------------------------------
export const AUTH_STORAGE_KEYS = [
  'token',
  'authToken',
  'hasToken',
  'hasAuthToken',
  'isLoggedIn',
  'userId',
  'userEmail',
  'userName'
]

export const clearAuthStorage = () => {
  try {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
  } catch (e) {
    console.debug('clearAuthStorage error', e)
  }
}

// ---------------------------------------------------------------------------
// Token refresh logic — prevents the "auto-logout after few seconds" bug.
//
// When the backend returns 401 with code TOKEN_EXPIRED, we attempt ONE
// silent refresh via the /api/users/refresh endpoint (which reads the
// httpOnly refresh_token cookie).  If the refresh succeeds we replay the
// original request.  If it fails we redirect to /login.
// ---------------------------------------------------------------------------

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

const redirectToLogin = () => {
  clearAuthStorage()
  if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
    window.location.replace('/login')
  }
}

// Endpoints where a 401 is just a failed login attempt — never auto-logout
const PUBLIC_AUTH_ROUTES = [
  '/api/users/login',
  '/api/users/admin/login',
  '/api/users/signup',
  '/api/users/verify',
  '/api/users/resend-otp'
]

// ---------------------------------------------------------------------------
// Response interceptor
// ---------------------------------------------------------------------------
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const url = originalRequest?.url || ''
    const isAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => url.includes(route))
    const authCode = error.response?.data?.code

    // --- 401 handling with automatic token refresh ---
    if (status === 401 && !isAuthRoute && !originalRequest._retry) {
      // If this is a TOKEN_EXPIRED and we haven't tried refreshing yet, attempt refresh
      if (authCode === 'TOKEN_EXPIRED' || authCode === 'NO_TOKEN') {
        if (isRefreshing) {
          // Queue this request while refresh is in progress
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(() => axios(originalRequest))
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          await axios.post('/api/users/refresh')
          processQueue(null)
          // Retry the original request — the new access_token cookie is now set
          return axios(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError)
          // Refresh failed — user truly needs to re-authenticate
          redirectToLogin()
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      // Non-TOKEN_EXPIRED 401 (invalid token, user not found, etc.) — logout immediately
      if (!isAuthRoute) {
        redirectToLogin()
      }
    }

    return Promise.reject(error)
  }
)

export default axios
