import { Empty } from 'antd'

interface EmptyStateProps {
    description?: string
}

export function EmptyState({ description = 'No data found' }: EmptyStateProps) {
    return (
        <div style={{ padding: '64px 0' }}>
            <Empty description={description} />
        </div>
    )
}
