import { theme as antdTheme } from 'antd'

export function TopRequestLoader({ loading }: { loading: boolean }) {
    const { token } = antdTheme.useToken()

    if (!loading) return null

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label="Loading"
            style={{
                width: '100%',
                height: 3,
                borderRadius: 999,
                overflow: 'hidden',
                background: token.colorFillSecondary,
            }}
        >
            <div
                style={{
                    width: '34%',
                    height: '100%',
                    borderRadius: 999,
                    background: token.colorPrimary,
                    animation: 'trendyTopLoader 1.1s ease-in-out infinite',
                }}
            />
        </div>
    )
}
