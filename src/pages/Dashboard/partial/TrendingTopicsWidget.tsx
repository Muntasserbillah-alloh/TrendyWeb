import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Empty, Segmented, Space, Tag, Typography } from 'antd'
import { getTrendingTopics } from '../../../api/youtube'
import { fetchPreviewTrends } from '../../../api/trends'
import { formatNumber } from '../../../utils'
import type { FetchTrendsResponse, Trend, YoutubeTrendingResponse } from '../../../types'
import { useDashboardContext } from './DashboardContext'
import { TrendPlatformPill, WidgetError, WidgetHeader, WidgetLoading } from './DashboardShared'
import { DASHBOARD_QUERY_STALE_TIME, resolveErrorMessage } from './DashboardUtils'

type TopicViewMode = 'youtube' | 'all'

function aggregateLiveTopics(
    trends: FetchTrendsResponse['trends']
): Array<{ topic: string; volume: number; platforms: Trend['platform'][] }> {
    const map = new Map<
        string,
        { topic: string; volume: number; platforms: Set<Trend['platform']> }
    >()

    trends.forEach((trend) => {
        const key = trend.title.trim().toLowerCase()
        const existing = map.get(key)
        if (existing) {
            existing.volume += trend.volume ?? 0
            existing.platforms.add(trend.platform)
            return
        }
        map.set(key, {
            topic: trend.title,
            volume: trend.volume ?? 0,
            platforms: new Set([trend.platform]),
        })
    })

    return Array.from(map.values())
        .map((item) => ({
            topic: item.topic,
            volume: item.volume,
            platforms: Array.from(item.platforms),
        }))
        .sort((left, right) => right.volume - left.volume)
}

export function TrendingTopicsWidget() {
    const { regionCode } = useDashboardContext()
    const navigate = useNavigate()
    const [viewMode, setViewMode] = useState<TopicViewMode>('youtube')

    const youtubeTrendingQuery = useQuery<YoutubeTrendingResponse>({
        queryKey: ['dashboard', 'youtube-trending-topics', regionCode],
        queryFn: async () => (await getTrendingTopics({ region_code: regionCode })).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const liveTrendsQuery = useQuery<FetchTrendsResponse>({
        queryKey: ['dashboard', 'live-trends', regionCode],
        queryFn: async () =>
            (await fetchPreviewTrends({ region_code: regionCode!, limit: 10 })).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const youtubeTopics = (youtubeTrendingQuery.data?.trending_topics ?? []).slice(0, 10)
    const liveTopics = useMemo(
        () => aggregateLiveTopics(liveTrendsQuery.data?.trends ?? []).slice(0, 10),
        [liveTrendsQuery.data?.trends]
    )

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <WidgetHeader
                    title="Trending Topics"
                    badgeLabel="Multi-platform"
                    badgeVariant="multi"
                    onRefresh={() => {
                        void youtubeTrendingQuery.refetch()
                        void liveTrendsQuery.refetch()
                    }}
                />

                <Segmented<TopicViewMode>
                    options={[
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'All Platforms', value: 'all' },
                    ]}
                    value={viewMode}
                    onChange={setViewMode}
                />

                {viewMode === 'youtube' ? (
                    <>
                        {youtubeTrendingQuery.isLoading && <WidgetLoading rows={6} />}

                        {youtubeTrendingQuery.error && (
                            <WidgetError
                                message={resolveErrorMessage(
                                    youtubeTrendingQuery.error,
                                    'Could not load YouTube topics.'
                                )}
                                onRetry={() => {
                                    void youtubeTrendingQuery.refetch()
                                }}
                            />
                        )}

                        {!youtubeTrendingQuery.isLoading &&
                            !youtubeTrendingQuery.error &&
                            youtubeTopics.length === 0 && (
                                <Empty description="No YouTube topics found." />
                            )}

                        {!youtubeTrendingQuery.isLoading &&
                            !youtubeTrendingQuery.error &&
                            youtubeTopics.length > 0 && (
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                    {youtubeTopics.map((item, index) => (
                                        <div
                                            key={`${item.topic}-${index}`}
                                            style={{
                                                alignItems: 'center',
                                                border: '1px solid #f0f0f0',
                                                borderRadius: 10,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                minWidth: 0,
                                                padding: '8px 10px',
                                                width: '100%',
                                            }}
                                        >
                                            <Typography.Text
                                                style={{
                                                    flex: 1,
                                                    marginInlineEnd: 8,
                                                    minWidth: 0,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={`${index + 1}. ${item.topic}`}
                                            >
                                                {index + 1}. {item.topic}
                                            </Typography.Text>
                                            <Tag
                                                color="red"
                                                style={{ flexShrink: 0, marginInlineEnd: 0 }}
                                                title="YouTube"
                                            >
                                                YouTube
                                            </Tag>
                                        </div>
                                    ))}
                                </Space>
                            )}
                    </>
                ) : (
                    <>
                        {liveTrendsQuery.isLoading && <WidgetLoading rows={6} />}

                        {liveTrendsQuery.error && (
                            <WidgetError
                                message={resolveErrorMessage(
                                    liveTrendsQuery.error,
                                    'Could not load live trends.'
                                )}
                                onRetry={() => {
                                    void liveTrendsQuery.refetch()
                                }}
                            />
                        )}

                        {!liveTrendsQuery.isLoading &&
                            !liveTrendsQuery.error &&
                            liveTopics.length === 0 && (
                                <Empty description="No live trends available." />
                            )}

                        {!liveTrendsQuery.isLoading &&
                            !liveTrendsQuery.error &&
                            liveTopics.length > 0 && (
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                    {liveTopics.map((item, index) => (
                                        <div
                                            key={`${item.topic}-${index}`}
                                            style={{
                                                border: '1px solid #f0f0f0',
                                                borderRadius: 10,
                                                padding: '8px 10px',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 6,
                                                    minWidth: 0,
                                                    width: '100%',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        alignItems: 'center',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        minWidth: 0,
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Typography.Text
                                                        strong
                                                        style={{
                                                            flex: 1,
                                                            marginInlineEnd: 8,
                                                            minWidth: 0,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                        title={item.topic}
                                                    >
                                                        {item.topic}
                                                    </Typography.Text>
                                                    <Typography.Text
                                                        style={{ flexShrink: 0 }}
                                                        type="secondary"
                                                    >
                                                        {formatNumber(item.volume)}
                                                    </Typography.Text>
                                                </div>
                                                <Space size={[6, 6]} wrap>
                                                    {item.platforms.map((platform) => (
                                                        <TrendPlatformPill
                                                            key={`${item.topic}-${platform}`}
                                                            platform={platform}
                                                        />
                                                    ))}
                                                </Space>
                                            </div>
                                        </div>
                                    ))}
                                </Space>
                            )}
                    </>
                )}

                <Button
                    type="link"
                    onClick={() => navigate('/trends/explore')}
                    style={{ paddingInline: 0 }}
                >
                    Explore full trends
                </Button>
            </Space>
        </Card>
    )
}
