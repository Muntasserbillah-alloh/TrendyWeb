import { Card, Space, Tag, Typography } from 'antd'
import { Eye, ThumbsUp, MessageCircle, Calendar } from 'lucide-react'
import { formatDate, formatDuration, formatNumber } from '../utils'
import { OutlierBadge } from './OutlierBadge'
import type { Video } from '../types'

const { Text } = Typography

interface VideoCardProps {
    video: Video
    showTags?: boolean
}

const LINE_CLAMP: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
}

export function VideoCard({ video, showTags = true }: VideoCardProps) {
    const videoTypeBadge =
        video.video_type === 'shorts'
            ? { label: 'SHORT', color: 'blue' as const }
            : video.video_type === 'normal'
                ? { label: 'NORMAL', color: 'default' as const }
                : null

    return (
        <a
            href={`https://www.youtube.com/watch?v=${video.video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', height: '100%' }}
        >
            <Card
                hoverable
                style={{
                    height: '100%',
                    borderColor: video.is_outlier ? '#ff9c6e' : undefined,
                    boxShadow: video.is_outlier ? '0 8px 24px rgba(255, 120, 40, 0.12)' : undefined,
                }}
                styles={{ body: { padding: 12 } }}
                cover={
                    <div style={{ position: 'relative' }}>
                        {video.thumbnail_url ? (
                            <img
                                alt={video.title}
                                src={video.thumbnail_url}
                                style={{ objectFit: 'cover', height: 150, width: '100%' }}
                            />
                        ) : (
                            <div
                                style={{
                                    height: 150,
                                    background: '#f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 32,
                                    color: '#bfbfbf',
                                }}
                            >
                                ▶
                            </div>
                        )}
                        {video.duration_seconds != null && (
                            <span
                                style={{
                                    position: 'absolute',
                                    right: 8,
                                    bottom: 8,
                                    background: 'rgba(0, 0, 0, 0.78)',
                                    color: '#fff',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                }}
                            >
                                {formatDuration(video.duration_seconds)}
                            </span>
                        )}
                    </div>
                }
            >
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 13, ...LINE_CLAMP }}>
                        {video.title}
                    </Text>
                    {videoTypeBadge && (
                        <Tag color={videoTypeBadge.color} style={{ marginInlineEnd: 0, width: 'fit-content' }}>
                            {videoTypeBadge.label}
                        </Tag>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {video.channel_title}
                        {video.channel_subscribers != null &&
                            ` · ${formatNumber(video.channel_subscribers)} subs`}
                    </Text>
                    <Text strong style={{ fontSize: 15, color: '#1677ff' }}>
                        <Eye size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {formatNumber(video.view_count)}
                    </Text>
                    <Space size={10}>
                        {video.like_count != null && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                <ThumbsUp size={11} style={{ marginRight: 2, verticalAlign: 'middle' }} />
                                {formatNumber(video.like_count)}
                            </Text>
                        )}
                        {video.comment_count != null && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                <MessageCircle size={11} style={{ marginRight: 2, verticalAlign: 'middle' }} />
                                {formatNumber(video.comment_count)}
                            </Text>
                        )}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            <Calendar size={11} style={{ marginRight: 2, verticalAlign: 'middle' }} />
                            {formatDate(video.published_at)}
                        </Text>
                    </Space>
                    <OutlierBadge score={video.outlier_score} isOutlier={video.is_outlier} />
                    {showTags && (video.tags?.length ?? 0) > 0 && (
                        <Space size={4} wrap>
                            {video.tags?.slice(0, 3).map((tag) => (
                                <Tag key={tag} bordered={false} style={{ marginInlineEnd: 0 }}>
                                    #{tag}
                                </Tag>
                            ))}
                        </Space>
                    )}
                    <Text type="secondary" style={{ fontSize: 11, color: '#1677ff' }}>
                        View on YouTube ↗
                    </Text>
                </Space>
            </Card>
        </a>
    )
}

