import { useState } from 'react'
import { Button, Card, Col, Input, Progress, Row, Select, Space, Typography } from 'antd'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useRegions } from '../../hooks/useRegions'
import { useSaturation } from '../../hooks/usePlanner'
import { Spinner } from '../../components/Spinner'
import type { SaturationResult } from '../../types'

const SATURATION_COLORS: Record<string, string> = {
    unsaturated: '#52c41a',
    low: '#73d13d',
    moderate: '#faad14',
    high: '#fa541c',
    oversaturated: '#f5222d',
}

export function SaturationTab() {
    const [topic, setTopic] = useState('')
    const [regionCode, setRegionCode] = useState<string | undefined>()
    const { data: regionsData } = useRegions()
    const mutation = useSaturation()

    const result: SaturationResult | undefined = mutation.data?.data

    const handleAnalyze = () => {
        if (!topic.trim()) return
        mutation.mutate({ topic: topic.trim(), region_code: regionCode })
    }

    const chartData = result ? [
        { name: 'Supply', value: result.supply, fill: '#fa8c16' },
        { name: 'Demand', value: result.demand, fill: '#1677ff' },
    ] : []

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
                <Row gutter={[12, 12]} align="middle">
                    <Col flex="1">
                        <Input
                            placeholder="Enter topic to check saturation..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onPressEnter={handleAnalyze}
                            size="large"
                        />
                    </Col>
                    <Col>
                        <Select
                            placeholder="Region"
                            allowClear
                            style={{ width: 160 }}
                            value={regionCode}
                            onChange={setRegionCode}
                            options={(regionsData?.data ?? []).map((r) => ({ value: r.code, label: r.name }))}
                        />
                    </Col>
                    <Col>
                        <Button type="primary" size="large" onClick={handleAnalyze} loading={mutation.isPending}>
                            Check Saturation
                        </Button>
                    </Col>
                </Row>
            </Card>

            {mutation.isPending && <Spinner tip="Checking saturation..." />}

            {result && (
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Card title="Supply vs Demand">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={80} />
                                    <Tooltip />
                                    <Bar dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title="Saturation Level">
                            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                                <Progress
                                    type="dashboard"
                                    percent={Math.round((result.supply / Math.max(result.demand, 1)) * 100)}
                                    strokeColor={SATURATION_COLORS[result.saturation_level]}
                                    size={160}
                                    format={() => result.saturation_level.replace('_', ' ')}
                                />
                                <Typography.Title level={4} style={{ marginTop: 16, color: SATURATION_COLORS[result.saturation_level] }}>
                                    {result.saturation_level.replace('_', ' ').toUpperCase()}
                                </Typography.Title>
                                <Typography.Text type="secondary">
                                    Topic: {result.topic}
                                </Typography.Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            )}
        </Space>
    )
}
