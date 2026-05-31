import { useState } from 'react'
import { Card, Col, Row, Select, Slider, Space, Table, Tag, Typography } from 'antd'
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { useRegions } from '../../hooks/useRegions'
import { useVelocity } from '../../hooks/useTrends'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { PlatformBadge } from '../../components/PlatformBadge'
import { formatNumber } from '../../utils'
import type { VelocityItem } from '../../types'

const STATUS_CONFIG: Record<VelocityItem['status'], { color: string; icon: React.ReactNode; label: string }> = {
    new: { color: 'purple', icon: <Sparkles size={12} />, label: 'New' },
    rising: { color: 'green', icon: <TrendingUp size={12} />, label: 'Rising' },
    stable: { color: 'default', icon: <Minus size={12} />, label: 'Stable' },
    falling: { color: 'red', icon: <TrendingDown size={12} />, label: 'Falling' },
}

export function VelocityPage() {
    const [regionCode, setRegionCode] = useState<string | undefined>()
    const [days, setDays] = useState(7)
    const { data: regionsData } = useRegions()
    const { data, isLoading, error } = useVelocity(regionCode, days)

    const velocityItems = data?.data ?? []

    const columns: ColumnsType<VelocityItem> = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Platform',
            dataIndex: 'platform',
            key: 'platform',
            width: 140,
            render: (p: VelocityItem['platform']) => <PlatformBadge platform={p} />,
        },
        {
            title: 'Current Volume',
            dataIndex: 'current_volume',
            key: 'current_volume',
            width: 130,
            align: 'right',
            sorter: (a, b) => a.current_volume - b.current_volume,
            render: (v: number) => formatNumber(v),
        },
        {
            title: 'Previous Volume',
            dataIndex: 'previous_volume',
            key: 'previous_volume',
            width: 140,
            align: 'right',
            render: (v: number) => formatNumber(v),
        },
        {
            title: 'Velocity',
            dataIndex: 'velocity',
            key: 'velocity',
            width: 120,
            align: 'right',
            sorter: (a, b) => a.velocity - b.velocity,
            render: (v: number) => (
                <Typography.Text style={{ color: v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : undefined }}>
                    {v > 0 ? '+' : ''}{(v ?? 0).toFixed(1)}%
                </Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            filters: [
                { text: 'New', value: 'new' },
                { text: 'Rising', value: 'rising' },
                { text: 'Stable', value: 'stable' },
                { text: 'Falling', value: 'falling' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status: VelocityItem['status']) => {
                const config = STATUS_CONFIG[status]
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {config.label}
                    </Tag>
                )
            },
        },
    ]

    // Summary stats
    const rising = velocityItems.filter((v) => v.status === 'rising').length
    const falling = velocityItems.filter((v) => v.status === 'falling').length
    const newItems = velocityItems.filter((v) => v.status === 'new').length

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <Typography.Title level={3} style={{ margin: 0 }}>Velocity Monitor</Typography.Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Select
                        placeholder="Select region"
                        style={{ width: 180 }}
                        value={regionCode}
                        onChange={setRegionCode}
                        options={(regionsData?.data ?? []).map((r) => ({ value: r.code, label: r.name }))}
                    />
                    <div style={{ minWidth: 200 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Period: {days} days
                        </Typography.Text>
                        <Slider min={1} max={90} value={days} onChange={setDays} />
                    </div>
                </div>
            </div>

            {!regionCode && (
                <Card>
                    <Typography.Text type="secondary">Select a region to monitor trend velocity</Typography.Text>
                </Card>
            )}

            {isLoading && <Spinner tip="Loading velocity data..." />}
            {error && <ErrorMessage error={error} />}

            {regionCode && velocityItems.length > 0 && (
                <>
                    {/* Summary cards */}
                    <Row gutter={[16, 16]}>
                        <Col xs={8}>
                            <Card size="small">
                                <div style={{ textAlign: 'center' }}>
                                    <Typography.Text type="secondary">Rising</Typography.Text>
                                    <Typography.Title level={3} style={{ margin: '4px 0 0', color: '#52c41a' }}>{rising}</Typography.Title>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={8}>
                            <Card size="small">
                                <div style={{ textAlign: 'center' }}>
                                    <Typography.Text type="secondary">Falling</Typography.Text>
                                    <Typography.Title level={3} style={{ margin: '4px 0 0', color: '#ff4d4f' }}>{falling}</Typography.Title>
                                </div>
                            </Card>
                        </Col>
                        <Col xs={8}>
                            <Card size="small">
                                <div style={{ textAlign: 'center' }}>
                                    <Typography.Text type="secondary">New</Typography.Text>
                                    <Typography.Title level={3} style={{ margin: '4px 0 0', color: '#722ed1' }}>{newItems}</Typography.Title>
                                </div>
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        dataSource={velocityItems}
                        columns={columns}
                        rowKey={(r) => `${r.title}-${r.platform}`}
                        pagination={{ pageSize: 20, showSizeChanger: true }}
                        scroll={{ x: 700 }}
                    />
                </>
            )}

            {regionCode && !isLoading && velocityItems.length === 0 && (
                <EmptyState description="No velocity data available for this region and period" />
            )}
        </Space>
    )
}
