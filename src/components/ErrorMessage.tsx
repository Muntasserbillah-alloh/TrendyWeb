import { Alert, Button, Space, Typography } from 'antd'

interface ErrorMessageProps {
    error: unknown
    message?: string
    onRetry?: () => void
    retryLabel?: string
}

export function ErrorMessage({ error, message, onRetry, retryLabel = 'Retry' }: ErrorMessageProps) {
    const msg =
        message ?? (error instanceof Error ? error.message : 'An unexpected error occurred.')
    return (
        <Alert
            type="error"
            message="Error"
            description={
                <Space direction="vertical" size={8}>
                    <Typography.Text>{msg}</Typography.Text>
                    {onRetry && (
                        <Button size="small" onClick={onRetry}>
                            {retryLabel}
                        </Button>
                    )}
                </Space>
            }
            showIcon
            style={{ margin: '16px 0' }}
        />
    )
}
