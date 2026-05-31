import { useEffect, useState } from 'react'
import { Button, Card, Col, Input, Progress, Row, Select, Space, Tag, Typography } from 'antd'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useSearchParams } from 'react-router-dom'
import { useRegions } from '../../hooks/useRegions'
import { useOpportunity } from '../../hooks/usePlanner'
import { Spinner } from '../../components/Spinner'
import type { OpportunityResult } from '../../types'

const COMPETITION_COLORS = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#fa541c',
    very_high: '#f5222d',
}

export function OpportunityTab() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [topic, setTopic] = useState(() => searchParams.get('seed_topic') ?? '')
    const [regionCode, setRegionCode] = useState<string | undefined>(() => searchParams.get('region_code') ?? undefined)
    const { data: regionsData } = useRegions()
    const mutation = useOpportunity()

    useEffect(() => {
        const seedTopic = searchParams.get('seed_topic')
        const seedRegion = searchParams.get('region_code')

        if (!seedTopic && !seedRegion) return

        setSearchParams((prev) => {
            const next = new URLSearchParams(prev)
            next.delete('seed_topic')
            next.delete('region_code')
            return next
        }, { replace: true })
    }, [searchParams, setSearchParams])

    const result: OpportunityResult | undefined = mutation.data?.data

    const handleAnalyze = () => {
        if (!topic.trim()) return
        mutation.mutate({ topic: topic.trim(), region_code: regionCode })
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
                <Row gutter={[12, 12]} align="middle">
                    <Col flex="1">
                        <Input
                            placeholder="Enter topic to analyze (e.g., AI tutorials, fitness tips)"
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
                            Analyze
                        </Button>
                    </Col>
                </Row>
            </Card>

            {mutation.isPending && <Spinner tip="Analyzing opportunity..." />}

            {result && (
                <Row gutter={[16, 16]}>
                    {/* Score Gauge */}
                    <Col xs={24} md={8}>
                        <Card title="Opportunity Score">
                            <div style={{ textAlign: 'center' }}>
                                <Progress
                                    type="dashboard"
                                    percent={result.score}
                                    format={(p) => `${p}`}
                                    strokeColor={result.score >= 70 ? '#52c41a' : result.score >= 40 ? '#faad14' : '#ff4d4f'}
                                    size={160}
                                />
                                <Typography.Title level={4} style={{ marginTop: 12 }}>{result.topic}</Typography.Title>
                            </div>
                        </Card>
                    </Col>

                    {/* Demand/Supply Breakdown */}
                    <Col xs={24} md={8}>
                        <Card title="Demand vs Supply">
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                <div>
                                    <Typography.Text type="secondary">Demand</Typography.Text>
                                    <Progress percent={Math.min(result.demand, 100)} strokeColor="#1677ff" />
                                </div>
                                <div>
                                    <Typography.Text type="secondary">Supply</Typography.Text>
                                    <Progress percent={Math.min(result.supply, 100)} strokeColor="#fa8c16" />
                                </div>
                                <div>
                                    <Typography.Text strong>Competition Level: </Typography.Text>
                                    <Tag color={COMPETITION_COLORS[result.competition_level]}>
                                        {(result.competition_level ?? "").replace('_', ' ').toUpperCase()}
                                    </Tag>
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* Recommendation */}
                    <Col xs={24} md={8}>
                        <Card title="Recommendation">
                            <Typography.Paragraph>{result.recommendation}</Typography.Paragraph>
                        </Card>
                    </Col>

                    {/* Growth Trajectory Chart */}
                    {result.growth_trajectory?.length > 0 && (
                        <Col xs={24}>
                            <Card title="Growth Trajectory">
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={result.growth_trajectory}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                    )}
                </Row>
            )}
        </Space>
    )
}
