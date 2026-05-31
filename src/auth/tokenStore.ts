import type { AuthUser, UserRole } from '../types'

const REFRESH_TOKEN_STORAGE_KEY = 'trendy:auth:refresh-token'
const AUTH_TOKEN_DATA_STORAGE_KEY = 'trendy:auth:token-data'
const AUTH_USER_STORAGE_KEY = 'trendy:auth:user'
const AUTH_STATE_EVENT = 'trendy:auth:state-changed'

export type AuthTokenData = Record<string, unknown> & {
  sub?: string | number
  id?: string | number
  user_id?: string | number
  role?: string
  email?: string
  exp?: number
  iat?: number
}

let accessToken: string | null = null

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (normalized === 'admin' || normalized === 'editor' || normalized === 'viewer') {
    return normalized
  }

  return null
}

function normalizeUserId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed)
    }
  }

  return null
}

function decodeBase64UrlPayload(segment: string): string | null {
  if (!segment) return null
  if (typeof atob !== 'function') return null

  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

function decodeTokenData(token: string): AuthTokenData | null {
  const tokenParts = token.split('.')
  if (tokenParts.length < 2) return null

  const payloadString = decodeBase64UrlPayload(tokenParts[1])
  if (!payloadString) return null

  try {
    const parsed = JSON.parse(payloadString) as unknown
    if (!isObjectRecord(parsed)) return null
    return parsed as AuthTokenData
  } catch {
    return null
  }
}

function mapTokenDataToUser(tokenData: AuthTokenData | null): AuthUser | null {
  if (!tokenData) return null

  const id = normalizeUserId(tokenData.id ?? tokenData.user_id ?? tokenData.sub)
  const role = normalizeRole(tokenData.role)
  const email = typeof tokenData.email === 'string' ? tokenData.email.trim() : ''

  if (id === null || !role || !email) {
    return null
  }

  return {
    id,
    email,
    role,
  }
}

function setStoredTokenData(tokenData: AuthTokenData | null): void {
  if (typeof window === 'undefined') return

  if (!tokenData) {
    window.localStorage.removeItem(AUTH_TOKEN_DATA_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_TOKEN_DATA_STORAGE_KEY, JSON.stringify(tokenData))
}

function setStoredAuthUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
}

function hydrateStoredDataFromToken(token: string | null): void {
  const tokenData = token ? decodeTokenData(token) : null
  setStoredTokenData(tokenData)
  setStoredAuthUser(mapTokenDataToUser(tokenData))
}

function readStoredTokenData(): AuthTokenData | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(AUTH_TOKEN_DATA_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isObjectRecord(parsed)) return null
    return parsed as AuthTokenData
  } catch {
    return null
  }
}

function emitAuthStateEvent(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_STATE_EVENT))
}

export function subscribeAuthState(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined

  const wrapped = () => listener()
  window.addEventListener(AUTH_STATE_EVENT, wrapped)
  return () => window.removeEventListener(AUTH_STATE_EVENT, wrapped)
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getStoredAuthTokenData(): AuthTokenData | null {
  return readStoredTokenData()
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (isObjectRecord(parsed)) {
        const role = normalizeRole(parsed.role)
        const id = normalizeUserId(parsed.id)
        const email = typeof parsed.email === 'string' ? parsed.email.trim() : ''

        if (role && id !== null && email) {
          return {
            id,
            email,
            role,
          }
        }
      }
    } catch {
      // Fallback to token payload if stored user JSON is malformed.
    }
  }

  return mapTokenDataToUser(readStoredTokenData())
}

export function setAccessToken(token: string | null | undefined): void {
  accessToken = token?.trim() || null

  hydrateStoredDataFromToken(accessToken)

  emitAuthStateEvent()
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
  return token?.trim() || null
}

export function setRefreshToken(token: string | null | undefined): void {
  if (typeof window === 'undefined') return

  const normalized = token?.trim() || null
  if (!normalized) {
    window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  } else {
    window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, normalized)
  }

  emitAuthStateEvent()
}

export function setAuthTokens(payload: {
  accessToken: string
  refreshToken?: string | null
}): void {
  setAccessToken(payload.accessToken)
  if (payload.refreshToken !== undefined) {
    setRefreshToken(payload.refreshToken)
  }
}

export function clearAuthTokens(): void {
  accessToken = null

  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(AUTH_TOKEN_DATA_STORAGE_KEY)
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
  }

  emitAuthStateEvent()
}
