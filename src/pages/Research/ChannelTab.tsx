import { useMemo, useState } from 'react'
import {
    Avatar,
    Button,
    Card,
    Col,
    Input,
    List,
    Progress,
    Row,
    Space,
    Tag,
    Typography,
} from 'antd'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChannelAnalysis } from '../../hooks/useYoutube'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { YoutubeFiltersPanel } from '../../components/youtube/YoutubeFiltersPanel'
import { useYoutubeGlobalFilters } from '../../hooks/useYoutubeGlobalFilters'
import { formatNumber } from '../../utils'

function extractChannelId(input: string): string | undefined {
    const trimmed = input.trim()
    if (!trimmed) return undefined

    if (!trimmed.includes('youtube.com')) return trimmed

    try {
        const url = new URL(trimmed)
        const channelPathMatch = url.pathname.match(/\/channel\/([^/]+)/)
        if (channelPathMatch?.[1]) return channelPathMatch[1]
    } catch {
        return trimmed
    }

    return trimmed
}

export function ChannelTab() {
    const [inputValue, setInputValue] = useState('')
    const [channelId, setChannelId] = useState<string | undefined>()

    const {
        date_from: dateFrom,
        date_to: dateTo,
        preset,
        setPreset,
        setDateFrom,
        setDateTo,
    } = useYoutubeGlobalFilters()

    const { data, isLoading, error, refetch } = useChannelAnalysis(channelId, {
        date_from: dateFrom,
        date_to: dateTo,
    })

    const channelData = data?.data

    const trendIcon = useMemo(() => {
        if (!channelData) return <ArrowRight size={18} />
        if (channelData.growth_indicators.trend === 'growing') return <TrendingUp size={18} />
        if (channelData.growth_indicators.trend === 'declining') return <TrendingDown size={18} />
        return <ArrowRight size={18} />
    }, [channelData])

    const growthChartData = channelData
        ? [
            { period: 'Older', views: channelData.growth_indicators.older_avg_views },
            { period: 'Recent', views: channelData.growth_indicators.recent_avg_views },
        ]
        : []

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
                <Row gutter={[12, 12]} align="bottom">
                    <Col flex={1}>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                            Channel ID or URL
                        </Typography.Text>
                        <Input
                            value={inputValue}
                            onChange={(event) => setInputValue(event.target.value)}
                            placeholder="Paste channel ID (UC...) or https://www.youtube.com/channel/..."
                            onPressEnter={() => setChannelId(extractChannelId(inputValue))}
                        />
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            loading={isLoading}
                            onClick={() => setChannelId(extractChannelId(inputValue))}
                        >
                            Analyze Channel
                        </Button>
                    </Col>
                </Row>
            </Card>

            <YoutubeFiltersPanel
                title="Channel Analysis Date Range"
                dateFrom={dateFrom}
                dateTo={dateTo}
                preset={preset}
                onPresetChange={setPreset}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                showRegion={false}
            />

            {!channelId && !isLoading && (
                <EmptyState description="Paste a channel ID or channel URL to start analysis." />
            )}

            {isLoading && (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Col xs={24} md={12} key={index}>
                            <Card loading style={{ height: 190 }} />
                        </Col>
                    ))}
                </Row>
            )}

            {error && <ErrorMessage error={error} onRetry={() => void refetch()} />}

            {channelData && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card>
                        <Space align="center" size={14}>
                            <Avatar size={56}>{channelData.channel_title.slice(0, 1).toUpperCase()}</Avatar>
                            <Space direction="vertical" size={0}>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {channelData.channel_title}
                                </Typography.Title>
                                <Typography.Text type="secondary">{channelData.channel_id}</Typography.Text>
                                <Typography.Text>
                                    {formatNumber(channelData.subscribers)} subscribers · {formatNumber(channelData.total_views)} total views
                                </Typography.Text>
                            </Space>
                        </Space>
                    </Card>

                    <Row gutter={[16, 16]}>
                        <Col xs={12} md={6}>
                            <Card size="small">
                                <Typography.Text type="secondary">Avg Views</Typography.Text>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {formatNumber(channelData.performance.avg_views)}
                                </Typography.Title>
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small">
                                <Typography.Text type="secondary">Median Views</Typography.Text>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {formatNumber(channelData.performance.median_views)}
                                </Typography.Title>
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small">
                                <Typography.Text type="secondary">Max Views</Typography.Text>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {formatNumber(channelData.performance.max_views)}
                                </Typography.Title>
                            </Card>
                        </Col>
                        <Col xs={12} md={6}>
                            <Card size="small">
                                <Typography.Text type="secondary">Videos Analyzed</Typography.Text>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {formatNumber(channelData.videos_analyzed)}
                                </Typography.Title>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={14}>
                            <Card title="Growth Trend" style={{ height: '100%' }}>
                                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                    <Space>
                                        {trendIcon}
                                        <Typography.Text strong style={{ textTransform: 'capitalize' }}>
                                            {channelData.growth_indicators.trend}
                                        </Typography.Text>
                                        <Tag color={channelData.growth_indicators.growth_ratio >= 1 ? 'green' : 'red'}>
                                            x{channelData.growth_indicators.growth_ratio.toFixed(2)}
                                        </Tag>
                                    </Space>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <LineChart data={growthChartData}>
                                            <XAxis dataKey="period" />
                                            <YAxis tickFormatter={(value: number) => formatNumber(value)} width={80} />
                                            <Tooltip formatter={(value: unknown) => formatNumber(value as number)} />
                                            <Line type="monotone" dataKey="views" stroke="#1677ff" strokeWidth={3} dot />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Space>
                            </Card>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card title="Consistency Score" style={{ height: '100%' }}>
                                <Progress
                                    percent={channelData.performance.consistency_score}
                                    status="active"
                                    strokeColor={channelData.performance.consistency_score >= 70 ? '#52c41a' : '#faad14'}
                                />
                                <Typography.Text type="secondary">
                                    Score is based on variance between recent and historical video performance.
                                </Typography.Text>
                            </Card>
                        </Col>
                    </Row>

                    <Card title={`Outlier Videos (${channelData.outliers.count})`}>
                        {channelData.outliers.videos.length === 0 ? (
                            <EmptyState description="No outlier videos detected for this date range." />
                        ) : (
                            <List
                                dataSource={channelData.outliers.videos}
                                renderItem={(video) => (
                                    <List.Item>
                                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                            <Typography.Text strong>{video.title}</Typography.Text>
                                            <Typography.Text type="secondary">
                                                {formatNumber(video.views)} views
                                            </Typography.Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Space>
            )}
        </Space>
    )
}
