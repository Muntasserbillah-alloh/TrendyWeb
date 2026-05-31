import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Empty, Space, Tag, Typography } from 'antd'
import { getTrendingVideos } from '../../../api/youtube'
import { formatNumber } from '../../../utils'
import type { TrendingVideosResult } from '../../../types'
import { useDashboardContext } from './DashboardContext'
import { WidgetError, WidgetHeader, WidgetLoading } from './DashboardShared'
import {
    DASHBOARD_QUERY_STALE_TIME,
    formatOutlierScore,
    outlierTagColor,
    resolveErrorMessage,
    videoTypeTag,
} from './DashboardUtils'

export function TrendingNowWidget() {
    const { regionCode } = useDashboardContext()
    const navigate = useNavigate()

    const query = useQuery<TrendingVideosResult>({
        queryKey: ['dashboard', 'youtube-trending-videos', regionCode],
        queryFn: async () =>
            (await getTrendingVideos({ region_code: regionCode!, max_results: 10, video_type: 'all' }))
                .data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const trendingVideos = (query.data?.videos ?? []).slice(0, 10)

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <WidgetHeader
                    title="YouTube Trending Now"
                    badgeLabel="YouTube"
                    badgeVariant="youtube"
                    onRefresh={() => {
                        void query.refetch()
                    }}
                />

                {query.isLoading && <WidgetLoading rows={6} />}

                {query.error && (
                    <WidgetError
                        message={resolveErrorMessage(query.error, 'Could not load trending videos.')}
                        onRetry={() => {
                            void query.refetch()
                        }}
                    />
                )}

                {!query.isLoading && !query.error && trendingVideos.length === 0 && (
                    <Empty description="No trending videos available for this region." />
                )}

                {!query.isLoading && !query.error && trendingVideos.length > 0 && (
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {trendingVideos.map((video, index) => {
                            const type = videoTypeTag(video.video_type)

                            return (
                                <a
                                    key={video.video_id}
                                    href={`https://www.youtube.com/watch?v=${video.video_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        border: '1px solid #f0f0f0',
                                        borderRadius: 10,
                                        color: 'inherit',
                                        display: 'block',
                                        padding: 10,
                                        textDecoration: 'none',
                                    }}
                                >
                                    <div
                                        style={{
                                            alignItems: 'flex-start',
                                            display: 'flex',
                                            gap: 10,
                                            minWidth: 0,
                                            width: '100%',
                                        }}
                                    >
                                        <Typography.Text
                                            strong
                                            style={{ flexShrink: 0, minWidth: 30, whiteSpace: 'nowrap' }}
                                        >
                                            #{index + 1}
                                        </Typography.Text>

                                        <img
                                            alt={video.title}
                                            src={video.thumbnail_url ?? ''}
                                            style={{
                                                borderRadius: 8,
                                                flexShrink: 0,
                                                height: 58,
                                                objectFit: 'cover',
                                                width: 104,
                                            }}
                                        />

                                        <div
                                            style={{
                                                display: 'flex',
                                                flex: 1,
                                                flexDirection: 'column',
                                                gap: 2,
                                                minWidth: 0,
                                            }}
                                        >
                                            <Typography.Text
                                                strong
                                                style={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={video.title}
                                            >
                                                {video.title}
                                            </Typography.Text>
                                            <Typography.Text
                                                type="secondary"
                                                style={{
                                                    display: 'block',
                                                    fontSize: 12,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={`${video.channel_title} · ${formatNumber(video.view_count)} views`}
                                            >
                                                {video.channel_title} · {formatNumber(video.view_count)} views
                                            </Typography.Text>
                                            <Space size={6} wrap>
                                                {video.outlier_score != null && (
                                                    <Tag
                                                        color={outlierTagColor(video.outlier_score)}
                                                        style={{ marginInlineEnd: 0 }}
                                                    >
                                                        {formatOutlierScore(video.outlier_score)}
                                                    </Tag>
                                                )}
                                                {type && (
                                                    <Tag color={type.color} style={{ marginInlineEnd: 0 }}>
                                                        {type.label}
                                                    </Tag>
                                                )}
                                            </Space>
                                        </div>
                                    </div>
                                </a>
                            )
                        })}
                    </Space>
                )}

                <Button
                    type="link"
                    onClick={() => navigate('/youtube/trending-videos')}
                    style={{ paddingInline: 0 }}
                >
                    See full trending videos
                </Button>
            </Space>
        </Card>
    )
}
