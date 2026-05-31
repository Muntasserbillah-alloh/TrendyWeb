import { Spin } from 'antd'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface RequireAuthProps {
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

export function RequireAuth({ children }: RequireAuthProps) {
    const location = useLocation()
    const { isAuthenticated, isBootstrapping } = useAuth()

    if (isBootstrapping) return <AuthLoader />

    if (!isAuthenticated) {
        const redirectTarget = `${location.pathname}${location.search}`
        return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTarget)}`} replace />
    }

    return <>{children}</>
}
