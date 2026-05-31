import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd'
import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { ErrorMessage } from '../../components/ErrorMessage'
import { Spinner } from '../../components/Spinner'
import { VideoCard } from '../../components/VideoCard'
import { useYoutubeCollectionDetail } from '../../hooks/useYoutube'
import { formatDate } from '../../utils'

function parseCollectionId(raw: string | undefined): number | undefined {
    if (!raw) return undefined
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined
    return Math.trunc(parsed)
}

export function CollectionDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    const collectionId = useMemo(() => parseCollectionId(id), [id])

    const {
        data,
        isLoading,
        error,
        refetch,
        isFetching,
    } = useYoutubeCollectionDetail(collectionId, { enabled: typeof collectionId === 'number' })

    if (typeof collectionId !== 'number') {
        return <ErrorMessage error={new Error('Invalid collection ID.')} message="Invalid collection ID." />
    }

    if (isLoading) {
        return <Spinner tip="Loading collection..." />
    }

    if (error) {
        return (
            <ErrorMessage
                error={error}
                message="Failed to load collection details."
                onRetry={() => void refetch()}
            />
        )
    }

    const collection = data?.data
    if (!collection) {
        return <EmptyState description="Collection was not found." />
    }

    const addVideosPath =
        collection.source === 'trending'
            ? `/youtube/trending-videos?append_collection_id=${collection.id}`
            : `/youtube/search?append_collection_id=${collection.id}`

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
                <Space direction="vertical" size={4}>
                    <Button icon={<ArrowLeft size={14} />} onClick={() => navigate('/youtube/collections')}>
                        Back to Collections
                    </Button>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        {collection.name}
                    </Typography.Title>
                    {collection.description && (
                        <Typography.Text type="secondary">{collection.description}</Typography.Text>
                    )}
                </Space>

                <Button type="primary" onClick={() => navigate(addVideosPath)}>
                    Add Videos
                </Button>
            </Space>

            <Card>
                <Space size={[8, 8]} wrap>
                    <Tag color={collection.source === 'search' ? 'blue' : 'volcano'}>{collection.source}</Tag>
                    <Tag>{collection.video_count} videos</Tag>
                    {collection.topic && <Tag color="purple">{collection.topic}</Tag>}
                    {(collection.region_code || typeof collection.region_id === 'number') && (
                        <Tag color="geekblue">
                            Region: {collection.region_code ?? `#${collection.region_id}`}
                        </Tag>
                    )}
                    {collection.video_type_filter && <Tag color="cyan">Type: {collection.video_type_filter}</Tag>}
                    <Tag>Updated: {formatDate(collection.updated_at)}</Tag>
                </Space>
            </Card>

            {isFetching && (
                <Typography.Text type="secondary">Refreshing collection videos...</Typography.Text>
            )}

            {collection.videos.length === 0 ? (
                <EmptyState description="No videos in this collection yet." />
            ) : (
                <Row gutter={[16, 16]}>
                    {collection.videos.map((video) => (
                        <Col key={video.video_id} xs={24} sm={12} lg={8} xl={6}>
                            <VideoCard video={video} />
                        </Col>
                    ))}
                </Row>
            )}
        </Space>
    )
}
