import { Spin } from 'antd'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface PublicOnlyRouteProps {
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

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
    const { isAuthenticated, isBootstrapping } = useAuth()

    if (isBootstrapping) return <AuthLoader />

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
}
