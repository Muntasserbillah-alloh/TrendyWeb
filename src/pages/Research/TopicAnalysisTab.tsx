import { useState } from 'react'
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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTopicAnalysisWithFilters } from '../../hooks/useYoutube'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { YoutubeFiltersPanel } from '../../components/youtube/YoutubeFiltersPanel'
import {
    competitionLevelColor,
    formatHour,
    formatNumber,
    opportunityScoreColor,
} from '../../utils'
import { OutlierBadge } from '../../components/OutlierBadge'
import { useYoutubeGlobalFilters } from '../../hooks/useYoutubeGlobalFilters'

export function TopicAnalysisTab() {
    const [inputTopic, setInputTopic] = useState('')
    const [topic, setTopic] = useState<string | undefined>()

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

    const { data, isLoading, error, refetch } = useTopicAnalysisWithFilters(topic, {
        region_code: regionCode,
        date_from: dateFrom,
        date_to: dateTo,
    })
    const analysis = data?.data
    const scoreColor = analysis ? opportunityScoreColor(analysis.opportunity_score) : '#8c8c8c'

    return (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Row gutter={[12, 12]} align="bottom">
                <Col flex={1} style={{ minWidth: 200 }}>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Topic</Typography.Text>
                    <Input
                        placeholder="e.g. electric vehicles"
                        value={inputTopic}
                        onChange={(e) => setInputTopic(e.target.value)}
                        onPressEnter={() => setTopic(inputTopic.trim() || undefined)}
                    />
                </Col>
                <Col>
                    <Button type="primary" loading={isLoading} onClick={() => setTopic(inputTopic.trim() || undefined)}>
                        Analyze
                    </Button>
                </Col>
            </Row>

            <YoutubeFiltersPanel
                title="Analysis Filters"
                regionCode={regionCode}
                onRegionChange={setRegionCode}
                dateFrom={dateFrom}
                dateTo={dateTo}
                preset={preset}
                onPresetChange={setPreset}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
            />

            {!topic && !isLoading && (
                <EmptyState description="Search for a topic first to generate analysis insights." />
            )}

            {isLoading && (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Col key={index} xs={24} md={12}>
                            <Card loading style={{ height: 220 }} />
                        </Col>
                    ))}
                </Row>
            )}
            {error && <ErrorMessage error={error} onRetry={() => void refetch()} />}

            {analysis && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Card title="Opportunity Score" style={{ height: '100%' }}>
                                <Space align="center" size={16}>
                                    <Progress
                                        type="circle"
                                        percent={analysis.opportunity_score}
                                        strokeColor={scoreColor}
                                        format={(value) => `${value}`}
                                        size={110}
                                    />
                                    <Space direction="vertical" size={4}>
                                        <Tag color={competitionLevelColor(analysis.competition_level.level)}>
                                            {analysis.competition_level.level.replace('_', ' ')}
                                        </Tag>
                                        <Typography.Text type="secondary">
                                            {analysis.competition_level.description}
                                        </Typography.Text>
                                    </Space>
                                </Space>
                            </Card>
                        </Col>
                        <Col xs={12} md={4}>
                            <Card size="small" style={{ height: '100%' }}>
                                <Typography.Text type="secondary">Avg Views</Typography.Text>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {formatNumber(analysis.stats.avg_views)}
                                </Typography.Title>
                            </Card>
                        </Col>
                        <Col xs={12} md={4}>
                            <Card size="small" style={{ height: '100%' }}>
                                <Typography.Text type="secondary">Engagement</Typography.Text>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {analysis.stats.engagement_rate.toFixed(2)}%
                                </Typography.Title>
                            </Card>
                        </Col>
                        <Col xs={12} md={4}>
                            <Card size="small" style={{ height: '100%' }}>
                                <Typography.Text type="secondary">Videos Analyzed</Typography.Text>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {formatNumber(analysis.videos_analyzed)}
                                </Typography.Title>
                            </Card>
                        </Col>
                        <Col xs={12} md={4}>
                            <Card size="small" style={{ height: '100%' }}>
                                <Typography.Text type="secondary">Max Outlier</Typography.Text>
                                <Typography.Title level={4} style={{ margin: 0 }}>
                                    {analysis.outlier_summary.max_outlier_score.toFixed(1)}x
                                </Typography.Title>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={14}>
                            <Card title="Channel Size Breakdown" style={{ height: '100%' }}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={analysis.channel_size_breakdown}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            formatter={(value: unknown) => formatNumber(value as number)}
                                            labelFormatter={(label) => `Tier: ${label}`}
                                        />
                                        <Bar dataKey="video_count" fill="#1677ff" name="Videos" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        </Col>
                        <Col xs={24} lg={10}>
                            <Card title="Best Posting Patterns" style={{ height: '100%' }}>
                                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <div>
                                        <Typography.Text type="secondary">Best days</Typography.Text>
                                        <div style={{ marginTop: 6 }}>
                                            <Space wrap>
                                                {analysis.best_posting_patterns.best_days.map((day) => (
                                                    <Tag key={day} color="blue">
                                                        {day}
                                                    </Tag>
                                                ))}
                                            </Space>
                                        </div>
                                    </div>
                                    <div>
                                        <Typography.Text type="secondary">Best hours</Typography.Text>
                                        <div style={{ marginTop: 6 }}>
                                            <Space wrap>
                                                {analysis.best_posting_patterns.best_hours.map((hour) => (
                                                    <Tag key={hour}>{formatHour(hour)}</Tag>
                                                ))}
                                            </Space>
                                        </div>
                                    </div>
                                </Space>
                            </Card>
                        </Col>
                    </Row>

                    <Card title="Top Outlier Videos">
                        <List
                            dataSource={analysis.top_outliers}
                            renderItem={(item) => (
                                <List.Item
                                    extra={<OutlierBadge score={item.outlier_score} isOutlier={item.outlier_score >= 2} />}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            item.thumbnail_url ? (
                                                <Avatar shape="square" size={64} src={item.thumbnail_url} />
                                            ) : (
                                                <Avatar shape="square" size={64}>
                                                    {item.channel_title.slice(0, 1).toUpperCase()}
                                                </Avatar>
                                            )
                                        }
                                        title={item.title}
                                        description={
                                            <Space size={12} wrap>
                                                <Typography.Text type="secondary">{item.channel_title}</Typography.Text>
                                                <Typography.Text type="secondary">
                                                    {formatNumber(item.view_count)} views
                                                </Typography.Text>
                                                {item.channel_subscribers != null && (
                                                    <Typography.Text type="secondary">
                                                        {formatNumber(item.channel_subscribers)} subs
                                                    </Typography.Text>
                                                )}
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Space>
            )}
        </Space>
    )
}
