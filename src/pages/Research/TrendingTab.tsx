import { useMemo, useState } from 'react'
import {
    Avatar,
    Button,
    Card,
    Col,
    Row,
    Select,
    Space,
    Switch,
    Tag,
    Typography,
} from 'antd'
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { useTrendingTopics } from '../../hooks/useYoutube'
import { useCategories } from '../../hooks/useCategories'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { formatNumber } from '../../utils'
import { useYoutubeGlobalFilters } from '../../hooks/useYoutubeGlobalFilters'
import { YoutubeFiltersPanel } from '../../components/youtube/YoutubeFiltersPanel'

const DONUT_COLORS = ['#1677ff', '#13c2c2', '#52c41a', '#f59e0b', '#ff4d4f', '#722ed1']

export function TrendingTab() {
    const navigate = useNavigate()
    const [categoryId, setCategoryId] = useState<number | undefined>()
    const [autoRefresh, setAutoRefresh] = useState(false)

    const {
        region_code: regionCode,
        date_from: dateFrom,
        date_to: dateTo,
        preset,
        setRegionCode,
        setPreset,
        setDateFrom,
        setDateTo,
    } = useYoutubeGlobalFilters()
    const { data: categoriesData } = useCategories()
    const { data, isLoading, error, refetch, isFetching } = useTrendingTopics(
        {
            region_code: regionCode,
            category_id: categoryId,
        },
        { autoRefresh }
    )

    const trendingData = data?.data

    const sortedTopics = useMemo(
        () => (trendingData?.trending_topics ?? []).slice().sort((a, b) => b.score - a.score),
        [trendingData?.trending_topics]
    )

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <YoutubeFiltersPanel
                title="Trending Filters"
                regionCode={regionCode}
                onRegionChange={setRegionCode}
                dateFrom={dateFrom}
                dateTo={dateTo}
                preset={preset}
                onPresetChange={setPreset}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                showDateRange={false}
                extra={
                    <Row gutter={[12, 12]} align="bottom">
                        <Col xs={24} md={14}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                                Category
                            </Typography.Text>
                            <Select
                                allowClear
                                placeholder="All categories"
                                value={categoryId}
                                onChange={(value) => setCategoryId(value)}
                                style={{ width: '100%' }}
                                options={(categoriesData?.data ?? []).map((category) => ({
                                    value: category.id,
                                    label: category.name,
                                }))}
                            />
                        </Col>
                        <Col xs={24} md={10}>
                            <Space align="center" size={10} style={{ height: 32 }}>
                                <Switch checked={autoRefresh} onChange={setAutoRefresh} />
                                <Typography.Text>Auto-refresh every 6 hours</Typography.Text>
                            </Space>
                        </Col>
                    </Row>
                }
            />

            {isLoading && (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Col xs={24} md={8} key={index}>
                            <Card loading style={{ height: 180 }} />
                        </Col>
                    ))}
                </Row>
            )}

            {error && <ErrorMessage error={error} onRetry={() => void refetch()} />}

            {!isLoading && !error && !trendingData && (
                <EmptyState description="No trending data available yet for this region." />
            )}

            {trendingData && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {isFetching && <Typography.Text type="secondary">Refreshing trending data...</Typography.Text>}

                    <Row gutter={[12, 12]}>
                        <Col>
                            <Card size="small">
                                <Typography.Text strong>{formatNumber(trendingData.videos_analyzed)}</Typography.Text>
                                <Typography.Text type="secondary"> videos analyzed</Typography.Text>
                            </Card>
                        </Col>
                        <Col>
                            <Card size="small">
                                <Typography.Text strong>{sortedTopics.length}</Typography.Text>
                                <Typography.Text type="secondary"> trending topics</Typography.Text>
                            </Card>
                        </Col>
                    </Row>

                    <Space wrap>
                        <Typography.Text type="secondary">Countries checked:</Typography.Text>
                        {trendingData.country_codes_checked.map((countryCode) => (
                            <Tag key={countryCode} color="blue">
                                {countryCode}
                            </Tag>
                        ))}
                    </Space>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={14}>
                            <Card title="Trending Topics Ranking" style={{ height: '100%' }}>
                                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                    {sortedTopics.map((topic, index) => (
                                        <div
                                            key={topic.topic}
                                            style={{
                                                border: '1px solid rgba(5, 5, 5, 0.08)',
                                                borderRadius: 10,
                                                padding: '10px 12px',
                                            }}
                                        >
                                            <Row align="middle" justify="space-between" gutter={[8, 8]}>
                                                <Col flex={1}>
                                                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                        <Typography.Text strong>
                                                            #{index + 1} {topic.topic}
                                                        </Typography.Text>
                                                        <Typography.Text type="secondary">
                                                            {topic.frequency} videos · {formatNumber(topic.total_views)} views
                                                        </Typography.Text>
                                                    </Space>
                                                </Col>
                                                <Col>
                                                    <Tag color={topic.score >= 75 ? 'green' : topic.score >= 50 ? 'gold' : 'orange'}>
                                                        Score {topic.score.toFixed(1)}
                                                    </Tag>
                                                </Col>
                                                <Col>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            navigate(`/youtube/search?topic=${encodeURIComponent(topic.topic)}`)
                                                        }
                                                    >
                                                        Research this topic
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </div>
                                    ))}
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card title="Trending Categories" style={{ height: '100%' }}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={trendingData.trending_categories}
                                            dataKey="percentage"
                                            nameKey="category"
                                            innerRadius={55}
                                            outerRadius={88}
                                        >
                                            {trendingData.trending_categories.map((item, index) => (
                                                <Cell
                                                    key={item.category}
                                                    fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: unknown) => `${Number(value).toFixed(1)}%`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                    </Row>

                    <Card title="Top Channels">
                        <Row gutter={[12, 12]}>
                            {trendingData.top_channels.map((channel) => (
                                <Col xs={24} md={12} lg={8} key={channel.channel}>
                                    <Card size="small">
                                        <Space>
                                            <Avatar>{channel.channel.slice(0, 1).toUpperCase()}</Avatar>
                                            <Space direction="vertical" size={2}>
                                                <Typography.Text strong>{channel.channel}</Typography.Text>
                                                <Typography.Text type="secondary">
                                                    {channel.trending_videos} trending videos
                                                </Typography.Text>
                                            </Space>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Space>
            )}
        </Space>
    )
}
