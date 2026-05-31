import { Space, Typography } from 'antd'
import { Outlet } from 'react-router-dom'

export function ResearchPage() {
    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={3} style={{ margin: 0 }}>YouTube Research</Typography.Title>
            <Outlet />
        </Space>
    )
}
