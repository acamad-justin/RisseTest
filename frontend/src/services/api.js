/**
 * Axios instance — central HTTP client.
 *
 * All API communication flows through this instance so that
 * base URL, headers, and interceptors are configured in one place.
 *
 * Usage:
 *   import api from '@/services/api'
 *   const response = await api.get('/health')
 */

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: false, // set to true when using session/cookie auth
  timeout: 10_000,
})

/* ---- Request Interceptor ---- */
api.interceptors.request.use(
  (config) => {
    // Attach auth token when available.
    // Replace 'auth_token' with your actual storage key later.
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/* ---- Response Interceptor ---- */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response

      if (status === 401) {
        // Token expired or not authenticated — handle sign-out here later.
        console.warn('[API] 401 Unauthorised — user needs to authenticate.')
      }

      if (status === 403) {
        console.warn('[API] 403 Forbidden — insufficient permissions.')
      }

      if (status >= 500) {
        console.error('[API] Server error:', error.response.data)
      }
    } else if (error.request) {
      console.error('[API] No response received. Check network or server status.')
    } else {
      console.error('[API] Request setup error:', error.message)
    }

    return Promise.reject(error)
  },
)

export default api
