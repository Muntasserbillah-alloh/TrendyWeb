import axios from 'axios'
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
} from '../auth/tokenStore'

const API_BASE_URL = 'http://localhost:5000'
const AUTH_LOGIN_PATH = '/api/v1/auth/login'
const AUTH_REFRESH_PATH = '/api/v1/auth/refresh'

let refreshAccessTokenPromise: Promise<string | null> | null = null

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false
  return url.includes(AUTH_LOGIN_PATH) || url.includes(AUTH_REFRESH_PATH)
}

async function refreshAccessTokenIfNeeded(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    clearAuthTokens()
    return null
  }

  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = axios
      .post(
        `${API_BASE_URL}${AUTH_REFRESH_PATH}`,
        { refresh_token: refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      )
      .then((response) => {
        const nextAccessToken = (response.data as { data?: { access_token?: string } })?.data
          ?.access_token

        if (!nextAccessToken) {
          clearAuthTokens()
          return null
        }

        setAccessToken(nextAccessToken)
        return nextAccessToken
      })
      .catch(() => {
        clearAuthTokens()
        return null
      })
      .finally(() => {
        refreshAccessTokenPromise = null
      })
  }

  return refreshAccessTokenPromise
}

apiClient.interceptors.request.use((config) => {
  const headers = config.headers ?? {}
  headers['Content-Type'] = 'application/json'

  const accessToken = getAccessToken()
  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  config.headers = headers
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as
        | { error?: { message?: string }; message?: string }
        | undefined

      const serverMessage = responseData?.error?.message ?? responseData?.message
      if (serverMessage) {
        error.message = serverMessage
      }

      const originalRequest = (error.config ?? null) as
        | (typeof error.config & { _retry?: boolean })
        | null
      const statusCode = error.response?.status

      if (
        statusCode === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !isAuthEndpoint(originalRequest.url)
      ) {
        originalRequest._retry = true

        const nextAccessToken = await refreshAccessTokenIfNeeded()
        if (nextAccessToken) {
          const headers = originalRequest.headers ?? {}
          headers.Authorization = `Bearer ${nextAccessToken}`
          originalRequest.headers = headers
          return apiClient(originalRequest)
        }

        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          const currentPath = `${window.location.pathname}${window.location.search}`
          const redirectTarget = `/login?redirect=${encodeURIComponent(currentPath)}`
          window.location.assign(redirectTarget)
        }
      }
    }

    return Promise.reject(error)
  }
)
