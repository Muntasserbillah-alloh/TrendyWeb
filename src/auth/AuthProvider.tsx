import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
    getCurrentUser,
    loginWithPassword,
    refreshAccessToken,
    registerUserByAdmin,
} from '../api/auth'
import {
    clearAuthTokens,
    getAccessToken,
    getStoredAuthUser,
    getRefreshToken,
    setAuthTokens,
    subscribeAuthState,
} from './tokenStore'
import type {
    AuthLoginRequest,
    AuthRegisterRequest,
    AuthUser,
} from '../types'

export interface AuthContextValue {
    user: AuthUser | null
    isAuthenticated: boolean
    isBootstrapping: boolean
    isAdmin: boolean
    isEditor: boolean
    isViewer: boolean
    login: (payload: AuthLoginRequest) => Promise<AuthUser>
    logout: () => void
    refreshSession: () => Promise<void>
    registerUser: (payload: AuthRegisterRequest) => Promise<AuthUser>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
    children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(() => getStoredAuthUser())
    const [isBootstrapping, setIsBootstrapping] = useState(true)

    const refreshSession = useCallback(async () => {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
            clearAuthTokens()
            setUser(null)
            return
        }

        const refreshResponse = await refreshAccessToken({ refresh_token: refreshToken })
        const accessToken = refreshResponse.data.access_token

        setAuthTokens({
            accessToken,
            refreshToken,
        })

        const tokenUser = getStoredAuthUser()
        if (tokenUser) {
            setUser(tokenUser)
        }

        const currentUserResponse = await getCurrentUser()
        setUser(currentUserResponse.data)
    }, [])

    useEffect(() => {
        let isMounted = true

        const bootstrapSession = async () => {
            try {
                await refreshSession()
            } catch {
                clearAuthTokens()
                if (isMounted) {
                    setUser(null)
                }
            } finally {
                if (isMounted) {
                    setIsBootstrapping(false)
                }
            }
        }

        void bootstrapSession()

        return () => {
            isMounted = false
        }
    }, [refreshSession])

    useEffect(() => {
        return subscribeAuthState(() => {
            const accessToken = getAccessToken()
            const refreshToken = getRefreshToken()

            if (!accessToken && !refreshToken) {
                setUser(null)
                return
            }

            if (accessToken) {
                const tokenUser = getStoredAuthUser()
                if (tokenUser) {
                    setUser(tokenUser)
                }
            }
        })
    }, [])

    const login = useCallback(async (payload: AuthLoginRequest): Promise<AuthUser> => {
        const response = await loginWithPassword(payload)

        setAuthTokens({
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
        })
        setUser(response.data.user)

        return response.data.user
    }, [])

    const logout = useCallback(() => {
        clearAuthTokens()
        setUser(null)
    }, [])

    const registerUser = useCallback(async (payload: AuthRegisterRequest): Promise<AuthUser> => {
        const response = await registerUserByAdmin(payload)
        return response.data.user
    }, [])

    const contextValue = useMemo<AuthContextValue>(() => {
        const role = user?.role

        return {
            user,
            isAuthenticated: !!user,
            isBootstrapping,
            isAdmin: role === 'admin',
            isEditor: role === 'editor' || role === 'admin',
            isViewer: !!user,
            login,
            logout,
            refreshSession,
            registerUser,
        }
    }, [user, isBootstrapping, login, logout, refreshSession, registerUser])

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
