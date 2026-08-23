import axios from 'axios'
import { backendUrl } from '../config'

// Cookie-based auth: the JWT lives in an httpOnly cookie, so every request
// must carry credentials. The backend also accepts Bearer headers as fallback.
axios.defaults.baseURL = backendUrl
axios.defaults.withCredentials = true

// Auth-related localStorage keys wiped on logout / session expiry
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

// Endpoints where a 401 is just a failed login attempt - never auto-logout
const PUBLIC_AUTH_ROUTES = [
  '/api/users/login',
  '/api/users/admin/login',
  '/api/users/signup',
  '/api/users/verify',
  '/api/users/resend-otp'
]

let redirecting = false

// Auto-logout: any 401 outside of login endpoints means the session token
// expired (or was revoked). Clear stored auth state and send the user to /login.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    const isAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => url.includes(route))

    if (status === 401 && !isAuthRoute && !redirecting) {
      redirecting = true
      clearAuthStorage()
      // Full reload resets Redux state; replace avoids a back-button trap
      window.location.replace('/login')
    }

    return Promise.reject(error)
  }
)

export default axios
