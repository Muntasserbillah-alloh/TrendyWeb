import { Spin, message } from 'antd'
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'

interface RequireRoleProps {
    roles: UserRole[]
    children: React.ReactNode
}

function AuthLoader() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Spin size="large" />
        </div>
    )
}

export function RequireRole({ roles, children }: RequireRoleProps) {
    const location = useLocation()
    const { user, isAuthenticated, isBootstrapping } = useAuth()

    useEffect(() => {
        if (!user) return
        if (roles.includes(user.role)) return
        void message.warning("You don't have permission to access this page.")
    }, [roles, user])

    if (isBootstrapping) return <AuthLoader />

    if (!isAuthenticated) {
        const redirectTarget = `${location.pathname}${location.search}`
        return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTarget)}`} replace />
    }

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
