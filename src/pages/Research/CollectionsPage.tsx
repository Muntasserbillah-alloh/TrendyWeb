import { useMemo, useState } from 'react'
import { Button, Card, Col, Input, Row, Segmented, Space, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { ErrorMessage } from '../../components/ErrorMessage'
import { Spinner } from '../../components/Spinner'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useYoutubeCollections } from '../../hooks/useYoutube'
import { formatDate } from '../../utils'
import type { YoutubeCollectionSource, YoutubeCollectionSummary } from '../../types'

type SourceFilter = 'all' | YoutubeCollectionSource

function buildRegionLabel(collection: YoutubeCollectionSummary): string {
    if (collection.region_code) return collection.region_code
    if (typeof collection.region_id === 'number') return `Region #${collection.region_id}`
    return 'Global'
}

export function CollectionsPage() {
    const navigate = useNavigate()
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
    const [topicFilter, setTopicFilter] = useState('')

    const debouncedTopicFilter = useDebouncedValue(topicFilter.trim(), 250)

    const {
        data,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useYoutubeCollections({
        source: sourceFilter === 'all' ? undefined : sourceFilter,
        topic: debouncedTopicFilter || undefined,
    })

    const collections = useMemo(() => {
        const items = data?.data ?? []
        return [...items].sort(
            (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
        )
    }, [data?.data])

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    My Collections
                </Typography.Title>
                <Typography.Text type="secondary">
                    Browse, filter, and reuse your saved YouTube collections.
                </Typography.Text>
            </Space>

            <Card>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={12}>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                            Source
                        </Typography.Text>
                        <Segmented
                            block
                            value={sourceFilter}
                            options={[
                                { label: 'All', value: 'all' },
                                { label: 'Search', value: 'search' },
                                { label: 'Trending', value: 'trending' },
                            ]}
                            onChange={(value) => setSourceFilter(value as SourceFilter)}
                        />
                    </Col>

                    <Col xs={24} md={12}>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                            Topic filter
                        </Typography.Text>
                        <Input
                            allowClear
                            placeholder="Filter by topic"
                            value={topicFilter}
                            onChange={(event) => setTopicFilter(event.target.value)}
                        />
                    </Col>
                </Row>
            </Card>

            {isLoading && <Spinner tip="Loading collections..." />}

            {error && (
                <ErrorMessage
                    error={error}
                    onRetry={() => void refetch()}
                    message="Failed to load collections."
                />
            )}

            {!isLoading && !error && collections.length === 0 && (
                <Card>
                    <EmptyState description="No collections found for the selected filters." />
                    <Space>
                        <Button type="primary" onClick={() => navigate('/youtube/search')}>
                            Go to Search
                        </Button>
                        <Button onClick={() => navigate('/youtube/trending-videos')}>
                            Go to Trending Videos
                        </Button>
                    </Space>
                </Card>
            )}

            {!isLoading && !error && collections.length > 0 && (
                <>
                    <Typography.Text type="secondary">
                        {isFetching ? 'Refreshing collections...' : `${collections.length} collections`}
                    </Typography.Text>

                    <Row gutter={[16, 16]}>
                        {collections.map((collection) => (
                            <Col key={collection.id} xs={24} sm={12} lg={8}>
                                <Card
                                    title={collection.name}
                                    extra={<Tag color={collection.source === 'search' ? 'blue' : 'volcano'}>{collection.source}</Tag>}
                                    actions={[
                                        <Button
                                            key="view"
                                            type="link"
                                            onClick={() => navigate(`/youtube/collections/${collection.id}`)}
                                        >
                                            View
                                        </Button>,
                                        <Button
                                            key="add-videos"
                                            type="link"
                                            onClick={() => {
                                                const targetPath =
                                                    collection.source === 'trending'
                                                        ? '/youtube/trending-videos'
                                                        : '/youtube/search'
                                                navigate(`${targetPath}?append_collection_id=${collection.id}`)
                                            }}
                                        >
                                            Add Videos
                                        </Button>,
                                    ]}
                                >
                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                        {collection.description && (
                                            <Typography.Paragraph
                                                type="secondary"
                                                style={{ marginBottom: 0 }}
                                                ellipsis={{ rows: 2 }}
                                            >
                                                {collection.description}
                                            </Typography.Paragraph>
                                        )}

                                        <Space size={[8, 8]} wrap>
                                            <Tag>{collection.video_count} videos</Tag>
                                            {collection.topic && <Tag color="purple">{collection.topic}</Tag>}
                                            <Tag color="geekblue">{buildRegionLabel(collection)}</Tag>
                                            {collection.video_type_filter && <Tag color="cyan">{collection.video_type_filter}</Tag>}
                                        </Space>

                                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                            Updated {formatDate(collection.updated_at)}
                                        </Typography.Text>
                                    </Space>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </Space>
    )
}
