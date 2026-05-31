import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Empty, Space, Tag, Typography } from 'antd'
import { getOutliers } from '../../../api/youtube'
import type { Video } from '../../../types'
import { WidgetError, WidgetHeader, WidgetLoading } from './DashboardShared'
import { DASHBOARD_QUERY_STALE_TIME, formatOutlierScore, outlierTagColor, resolveErrorMessage } from './DashboardUtils'

export function OutlierVideosWidget() {
    const navigate = useNavigate()

    const query = useQuery({
        queryKey: ['dashboard', 'outliers-top'],
        queryFn: async () => getOutliers({ per_page: 5 }),
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const outlierVideos: Video[] = query.data?.data ?? []

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <WidgetHeader
                    title="Top Outlier Videos"
                    badgeLabel="YouTube"
                    badgeVariant="youtube"
                    onRefresh={() => {
                        void query.refetch()
                    }}
                />

                {query.isLoading && <WidgetLoading rows={5} />}

                {query.error && (
                    <WidgetError
                        message={resolveErrorMessage(query.error, 'Could not load outliers.')}
                        onRetry={() => {
                            void query.refetch()
                        }}
                    />
                )}

                {!query.isLoading && !query.error && outlierVideos.length === 0 && (
                    <Empty description="No saved outlier videos yet." />
                )}

                {!query.isLoading && !query.error && outlierVideos.length > 0 && (
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {outlierVideos.map((video) => (
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
                                    padding: '8px 10px',
                                    textDecoration: 'none',
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
                                    <Tag
                                        color={outlierTagColor(video.outlier_score)}
                                        style={{ flexShrink: 0, marginInlineEnd: 0 }}
                                    >
                                        {formatOutlierScore(video.outlier_score)}
                                    </Tag>
                                    <Typography.Text
                                        style={{
                                            flex: 1,
                                            marginInlineStart: 8,
                                            minWidth: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                        title={video.title}
                                    >
                                        {video.title}
                                    </Typography.Text>
                                </div>
                            </a>
                        ))}

                        <Button
                            type="link"
                            onClick={() => navigate('/youtube/outliers')}
                            style={{ paddingInline: 0 }}
                        >
                            View all outliers
                        </Button>
                    </Space>
                )}
            </Space>
        </Card>
    )
}
