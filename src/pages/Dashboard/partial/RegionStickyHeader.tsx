import { Card, Select, Space, Typography } from 'antd'
import { useDashboardContext } from './DashboardContext'

export function RegionStickyHeader() {
    const { regionCode, regionOptions, onRegionChange } = useDashboardContext()

    return (
        <Card style={{ position: 'sticky', top: 8, zIndex: 4 }} styles={{ body: { padding: 14 } }}>
            <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }} wrap>
                <Space direction="vertical" size={0}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Dashboard
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Region-aware live signals and saved-data insights.
                    </Typography.Text>
                </Space>

                <Space wrap style={{ maxWidth: '100%' }}>
                    <Typography.Text strong>Region</Typography.Text>
                    <Select
                        style={{ maxWidth: '100%', minWidth: 180, width: 240 }}
                        value={regionCode}
                        options={regionOptions}
                        placeholder="Select region"
                        onChange={onRegionChange}
                    />
                </Space>
            </Space>
        </Card>
    )
}
