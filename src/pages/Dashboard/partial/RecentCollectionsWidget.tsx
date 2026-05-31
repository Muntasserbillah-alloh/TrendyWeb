import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd'
import { getYoutubeCollections } from '../../../api/youtube'
import { formatDate } from '../../../utils'
import { WidgetError, WidgetHeader, WidgetLoading } from './DashboardShared'
import {
    DASHBOARD_QUERY_STALE_TIME,
    buildCollectionAddPath,
    collectionSourceTagColor,
    resolveErrorMessage,
} from './DashboardUtils'

export function RecentCollectionsWidget() {
    const navigate = useNavigate()

    const query = useQuery({
        queryKey: ['dashboard', 'recent-collections'],
        queryFn: async () => getYoutubeCollections(),
        staleTime: DASHBOARD_QUERY_STALE_TIME,
        refetchOnMount: 'always',
    })

    const recentCollections = useMemo(
        () =>
            [...(query.data?.data ?? [])]
                .sort(
                    (left, right) =>
                        new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
                )
                .slice(0, 4),
        [query.data?.data]
    )

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <WidgetHeader
                    title="Recent Collections"
                    badgeLabel="YouTube"
                    badgeVariant="youtube"
                    onRefresh={() => {
                        void query.refetch()
                    }}
                />

                {query.isLoading && <WidgetLoading rows={6} />}

                {query.error && (
                    <WidgetError
                        message={resolveErrorMessage(query.error, 'Could not load recent collections.')}
                        onRetry={() => {
                            void query.refetch()
                        }}
                    />
                )}

                {!query.isLoading && !query.error && recentCollections.length === 0 && (
                    <Empty
                        description="You have not saved any collections yet."
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={() => navigate('/youtube/search')}>
                            Start a search
                        </Button>
                    </Empty>
                )}

                {!query.isLoading && !query.error && recentCollections.length > 0 && (
                    <>
                        <Row gutter={[12, 12]} style={{ marginInline: 0 }}>
                            {recentCollections.map((collection) => (
                                <Col key={collection.id} xs={24} md={12} style={{ minWidth: 0 }}>
                                    <Card size="small" style={{ height: '100%' }}>
                                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                            <Typography.Text
                                                strong
                                                style={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={collection.name}
                                            >
                                                {collection.name}
                                            </Typography.Text>

                                            <Space size={[6, 6]} wrap>
                                                <Tag
                                                    color={collectionSourceTagColor(collection.source)}
                                                    style={{ marginInlineEnd: 0 }}
                                                >
                                                    {collection.source}
                                                </Tag>
                                                <Tag style={{ marginInlineEnd: 0 }}>
                                                    {collection.video_count} videos
                                                </Tag>
                                                {collection.topic && (
                                                    <Tag style={{ marginInlineEnd: 0 }}>
                                                        {collection.topic}
                                                    </Tag>
                                                )}
                                                {collection.region_code && (
                                                    <Tag style={{ marginInlineEnd: 0 }}>
                                                        {collection.region_code}
                                                    </Tag>
                                                )}
                                            </Space>

                                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                {formatDate(collection.created_at)}
                                            </Typography.Text>

                                            <Space>
                                                <Button
                                                    size="small"
                                                    onClick={() =>
                                                        navigate(
                                                            `/youtube/collections/${collection.id}`
                                                        )
                                                    }
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="small"
                                                    onClick={() =>
                                                        navigate(buildCollectionAddPath(collection))
                                                    }
                                                >
                                                    Add Videos
                                                </Button>
                                            </Space>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Button
                            type="link"
                            onClick={() => navigate('/youtube/collections')}
                            style={{ paddingInline: 0 }}
                        >
                            View all collections
                        </Button>
                    </>
                )}
            </Space>
        </Card>
    )
}
