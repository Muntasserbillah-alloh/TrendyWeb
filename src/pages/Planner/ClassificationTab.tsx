import { useState } from 'react'
import { Card, Col, Row, Select, Space, Tag, Typography } from 'antd'
import { useRegions } from '../../hooks/useRegions'
import { useClassification } from '../../hooks/usePlanner'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { PlatformBadge } from '../../components/PlatformBadge'
import { formatNumber } from '../../utils'
import type { ClassifiedTrend } from '../../types'

const CLASSIFICATION_CONFIG: Record<ClassifiedTrend['classification'], { color: string; label: string; tagColor: string }> = {
    evergreen: { color: '#1677ff', label: '🌲 Evergreen', tagColor: 'blue' },
    rising: { color: '#52c41a', label: '📈 Rising', tagColor: 'green' },
    viral_spike: { color: '#fa8c16', label: '🔥 Viral Spike', tagColor: 'orange' },
    declining: { color: '#ff4d4f', label: '📉 Declining', tagColor: 'red' },
    emerging: { color: '#722ed1', label: '✨ Emerging', tagColor: 'purple' },
}

export function ClassificationTab() {
    const [regionCode, setRegionCode] = useState<string | undefined>()
    const { data: regionsData } = useRegions()
    const { data, isLoading, error } = useClassification(regionCode)

    const trends = data?.data ?? []

    const grouped = trends.reduce<Record<string, ClassifiedTrend[]>>((acc, t) => {
        const key = t.classification
        if (!acc[key]) acc[key] = []
        acc[key].push(t)
        return acc
    }, {})

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
                <Select
                    placeholder="Select region to classify trends"
                    style={{ width: 200 }}
                    value={regionCode}
                    onChange={setRegionCode}
                    options={(regionsData?.data ?? []).map((r) => ({ value: r.code, label: r.name }))}
                />
            </Card>

            {!regionCode && (
                <Card>
                    <Typography.Text type="secondary">Select a region to view classified trends</Typography.Text>
                </Card>
            )}

            {isLoading && <Spinner tip="Classifying trends..." />}
            {error && <ErrorMessage error={error} />}

            {Object.keys(grouped).length > 0 && (
                <Row gutter={[16, 16]}>
                    {Object.entries(CLASSIFICATION_CONFIG).map(([key, config]) => {
                        const items = grouped[key] ?? []
                        if (items.length === 0) return null
                        return (
                            <Col xs={24} md={12} lg={8} key={key}>
                                <Card
                                    title={
                                        <span style={{ color: config.color }}>
                                            {config.label} ({items.length})
                                        </span>
                                    }
                                    style={{ borderTop: `3px solid ${config.color}`, height: '100%' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {items.slice(0, 10).map((item, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Typography.Text ellipsis style={{ fontSize: 13 }}>{item.title}</Typography.Text>
                                                </div>
                                                <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                                                    <PlatformBadge platform={item.platform} />
                                                    {item.volume > 0 && (
                                                        <Tag style={{ fontSize: 11 }}>{formatNumber(item.volume)}</Tag>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {items.length > 10 && (
                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                +{items.length - 10} more
                                            </Typography.Text>
                                        )}
                                    </div>
                                </Card>
                            </Col>
                        )
                    })}
                </Row>
            )}
        </Space>
    )
}
