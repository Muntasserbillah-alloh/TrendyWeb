import { useState } from 'react'
import { Button, Card, Col, Input, Row, Select, Space, Tag, Typography } from 'antd'
import { useRegions } from '../../hooks/useRegions'
import { useRelatedTopics } from '../../hooks/usePlanner'
import { Spinner } from '../../components/Spinner'
import type { RelatedTopic } from '../../types'
import { formatNumber } from '../../utils'

export function RelatedTopicsTab() {
    const [topic, setTopic] = useState('')
    const [regionCode, setRegionCode] = useState<string | undefined>()
    const { data: regionsData } = useRegions()
    const mutation = useRelatedTopics()

    const results: RelatedTopic[] = mutation.data?.data ?? []

    const handleSearch = () => {
        if (!topic.trim()) return
        mutation.mutate({ topic: topic.trim(), region_code: regionCode, limit: 20 })
    }

    const getRelevanceColor = (score: number) => {
        if (score >= 0.8) return '#52c41a'
        if (score >= 0.6) return '#1677ff'
        if (score >= 0.4) return '#faad14'
        return '#8c8c8c'
    }

    const getNodeSize = (score: number) => {
        return 40 + score * 60
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
                <Row gutter={[12, 12]} align="middle">
                    <Col flex="1">
                        <Input
                            placeholder="Enter seed topic to explore related topics..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onPressEnter={handleSearch}
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
                        <Button type="primary" size="large" onClick={handleSearch} loading={mutation.isPending}>
                            Explore
                        </Button>
                    </Col>
                </Row>
            </Card>

            {mutation.isPending && <Spinner tip="Finding related topics..." />}

            {results.length > 0 && (
                <>
                    {/* Network-style visualization */}
                    <Card title={`Related Topics for "${topic}"`}>
                        <div style={{ position: 'relative', minHeight: 400, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
                            {/* Center node */}
                            <div style={{
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: '#6366f1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 13,
                                textAlign: 'center',
                                padding: 8,
                                boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                            }}>
                                {topic}
                            </div>
                            {/* Related nodes */}
                            {results.map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: getNodeSize(item.relevance),
                                        height: getNodeSize(item.relevance),
                                        borderRadius: '50%',
                                        background: getRelevanceColor(item.relevance),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: 600,
                                        fontSize: 11,
                                        textAlign: 'center',
                                        padding: 6,
                                        opacity: 0.7 + item.relevance * 0.3,
                                        cursor: 'default',
                                        transition: 'transform 0.2s',
                                    }}
                                    title={`${item.topic} — relevance: ${(item.relevance * 100).toFixed(0)}%`}
                                >
                                    {item.topic}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* List view */}
                    <Card title="Topic Details" size="small">
                        <Row gutter={[8, 8]}>
                            {results.map((item, i) => (
                                <Col xs={24} sm={12} md={8} key={i}>
                                    <Card size="small" style={{ height: '100%' }}>
                                        <Typography.Text strong>{item.topic}</Typography.Text>
                                        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                                            <Tag color={getRelevanceColor(item.relevance)} style={{ color: '#fff' }}>
                                                {((item.relevance ?? 0) * 100).toFixed(0)}% relevant
                                            </Tag>
                                            {item.volume && <Tag>{formatNumber(item.volume)} vol</Tag>}
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </>
            )}
        </Space>
    )
}
