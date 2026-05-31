import { useState } from 'react'
import { Card, Col, Collapse, Progress, Row, Select, Space, Tag, Typography } from 'antd'
import { Star, Clock, MessageCircle } from 'lucide-react'
import { useRegions } from '../../hooks/useRegions'
import { useCategories } from '../../hooks/useCategories'
import { useCreatorRecommendations } from '../../hooks/useTrends'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { PlatformBadge } from '../../components/PlatformBadge'
import { formatNumber } from '../../utils'

export function CreatorPage() {
    const [regionCode, setRegionCode] = useState<string | undefined>()
    const [category, setCategory] = useState<string | undefined>()
    const { data: regionsData } = useRegions()
    const { data: categoriesData } = useCategories()
    const { data, isLoading, error } = useCreatorRecommendations(regionCode, { category })

    const recommendations = data?.data ?? []

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <Typography.Title level={3} style={{ margin: 0 }}>Creator Recommendations</Typography.Title>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Select
                        placeholder="Select region"
                        style={{ width: 180 }}
                        value={regionCode}
                        onChange={setRegionCode}
                        options={(regionsData?.data ?? []).map((r) => ({ value: r.code, label: r.name }))}
                    />
                    <Select
                        placeholder="Category (optional)"
                        allowClear
                        style={{ width: 180 }}
                        value={category}
                        onChange={setCategory}
                        options={(categoriesData?.data ?? []).map((c) => ({ value: c.name, label: c.name }))}
                    />
                </div>
            </div>

            {!regionCode && (
                <Card>
                    <Typography.Text type="secondary">Select a region to see topic recommendations for creators</Typography.Text>
                </Card>
            )}

            {isLoading && <Spinner tip="Loading recommendations..." />}
            {error && <ErrorMessage error={error} />}

            {regionCode && !isLoading && recommendations.length === 0 && (
                <EmptyState description="No recommendations available for this region" />
            )}

            <Row gutter={[16, 16]}>
                {(recommendations ?? []).map((rec, i) => (
                    <Col xs={24} md={12} lg={8} key={i}>
                        <Card
                            style={{ height: '100%' }}
                            title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Typography.Text strong style={{ fontSize: 14 }}>#{i + 1}</Typography.Text>
                                    <Typography.Text ellipsis strong>{rec.title}</Typography.Text>
                                </div>
                            }
                        >
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                {/* Creator Score */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Typography.Text type="secondary">
                                            <Star size={12} style={{ marginRight: 4 }} />Creator Score
                                        </Typography.Text>
                                        <Typography.Text strong>{(rec.creator_score ?? 0).toFixed(1)}</Typography.Text>
                                    </div>
                                    <Progress
                                        percent={Math.min(rec.creator_score ?? 0, 100)}
                                        showInfo={false}
                                        strokeColor={rec.creator_score >= 70 ? '#52c41a' : rec.creator_score >= 40 ? '#faad14' : '#ff4d4f'}
                                    />
                                </div>

                                {/* Volume & Platforms */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <Tag color="blue">{formatNumber(rec.volume ?? 0)} vol</Tag>
                                    {(rec.platforms ?? []).map((p) => (
                                        <PlatformBadge key={p} platform={p} />
                                    ))}
                                </div>

                                {/* Recency badge */}
                                <Tag icon={<Clock size={11} style={{ marginRight: 4 }} />} color="default">
                                    {rec.recency}
                                </Tag>

                                {/* Why this topic */}
                                <Collapse
                                    size="small"
                                    items={[{
                                        key: '1',
                                        label: <span><MessageCircle size={12} style={{ marginRight: 4 }} />Why this topic?</span>,
                                        children: <Typography.Text>{rec.reason}</Typography.Text>,
                                    }]}
                                />
                            </Space>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Space>
    )
}
