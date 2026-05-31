import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
    Button,
    Card,
    Col,
    Empty,
    Row,
    Segmented,
    Select,
    Skeleton,
    Space,
    Spin,
    Tag,
    Typography,
} from 'antd'
import { useRegions } from '../../hooks/useRegions'
import {
    getOutliers,
    getTrendingTopics,
    getTrendingVideos,
    getYoutubeCollections,
} from '../../api/youtube'
import {
    fetchPreviewTrends,
    getCreatorRecommendations,
    getCrossPlatform,
    getTrendsGrouped,
    getVelocity,
} from '../../api/trends'
import { formatDate, formatNumber, platformLabel } from '../../utils'
import type {
    CrossPlatformItem,
    CreatorRecommendation,
    FetchTrendsResponse,
    Trend,
    TrendsGroupedItem,
    TrendingVideosResult,
    Video,
    VelocityItem,
    YoutubeCollectionSummary,
    YoutubeTrendingResponse,
} from '../../types'

const DASHBOARD_REGION_STORAGE_KEY = 'dashboard_region'
const DASHBOARD_QUERY_STALE_TIME = 5 * 60 * 1000

type DashboardBadgeVariant = 'youtube' | 'tiktok' | 'google' | 'multi' | 'all' | 'saved'

type TopicViewMode = 'youtube' | 'all'

const DASHBOARD_BADGE_STYLE: Record<DashboardBadgeVariant, CSSProperties> = {
    youtube: {
        background: '#FF0000',
        color: '#fff',
    },
    tiktok: {
        background: '#111111',
        color: '#fff',
    },
    google: {
        background: '#4285F4',
        color: '#fff',
    },
    multi: {
        background: '#7C3AED',
        color: '#fff',
    },
    all: {
        background: '#4338CA',
        color: '#fff',
    },
    saved: {
        background: '#0D9488',
        color: '#fff',
    },
}

const TREND_PLATFORM_STYLE: Record<Trend['platform'], CSSProperties> = {
    youtube: {
        background: '#FF0000',
        color: '#fff',
    },
    tiktok: {
        background: '#111111',
        color: '#fff',
    },
    google_trends: {
        background: '#4285F4',
        color: '#fff',
    },
    twitter: {
        background: '#0EA5E9',
        color: '#fff',
    },
}

function DashboardBadge({ label, variant }: { label: string; variant: DashboardBadgeVariant }) {
    return (
        <span
            style={{
                ...DASHBOARD_BADGE_STYLE[variant],
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1,
                padding: '6px 10px',
            }}
        >
            {label}
        </span>
    )
}

function TrendPlatformPill({ platform }: { platform: Trend['platform'] }) {
    return (
        <span
            style={{
                ...TREND_PLATFORM_STYLE[platform],
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1,
                padding: '4px 8px',
            }}
        >
            {platformLabel(platform)}
        </span>
    )
}

function WidgetHeader({
    title,
    badgeLabel,
    badgeVariant,
    onRefresh,
}: {
    title: string
    badgeLabel: string
    badgeVariant: DashboardBadgeVariant
    onRefresh: () => void
}) {
    return (
        <div style={{ alignItems: 'flex-start', display: 'flex', gap: 8, justifyContent: 'space-between', minWidth: 0, width: '100%', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 4, minWidth: 0 }}>
                <Typography.Title
                    level={5}
                    style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={title}
                >
                    {title}
                </Typography.Title>
                <DashboardBadge label={badgeLabel} variant={badgeVariant} />
            </div>

            <Button size="small" onClick={onRefresh} style={{ flexShrink: 0 }}>
                Refresh
            </Button>
        </div>
    )
}

function WidgetLoading({ rows = 5 }: { rows?: number }) {
    return <Skeleton active title={false} paragraph={{ rows, width: '100%' }} />
}

function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <Space direction="vertical" size={8}>
            <Typography.Text type="secondary">{message}</Typography.Text>
            <Button onClick={onRetry}>Retry</Button>
        </Space>
    )
}

function resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message
    }

    return fallback
}

function groupedLabel(item: TrendsGroupedItem, groupBy: 'platform' | 'category'): string {
    if (groupBy === 'platform') {
        return item.platform ? platformLabel(item.platform) : 'Unknown platform'
    }

    return item.category || 'Uncategorized'
}

function groupedTotal(items: TrendsGroupedItem[]): number {
    return items.reduce((acc, item) => acc + item.count, 0)
}

function outlierTagColor(score: number | null): 'green' | 'orange' | 'red' | 'default' {
    if (score == null) return 'default'
    if (score >= 10) return 'red'
    if (score >= 5) return 'orange'
    if (score >= 2) return 'green'
    return 'default'
}

function formatOutlierScore(score: number | null): string {
    if (score == null) return 'N/A'
    if (score >= 10) return `🔥 ${score.toFixed(1)}x`
    return `${score.toFixed(1)}x`
}

function videoTypeTag(videoType: string | undefined): { color: 'blue' | 'default'; label: string } | null {
    if (videoType === 'shorts') {
        return { color: 'blue', label: 'SHORT' }
    }

    if (videoType === 'normal') {
        return { color: 'default', label: 'NORMAL' }
    }

    return null
}

function collectionSourceTagColor(source: YoutubeCollectionSummary['source']): 'default' | 'orange' {
    return source === 'trending' ? 'orange' : 'default'
}

function buildCollectionAddPath(collection: YoutubeCollectionSummary): string {
    const basePath = collection.source === 'trending' ? '/youtube/trending-videos' : '/youtube/search'
    return `${basePath}?append_collection_id=${collection.id}`
}

function aggregateLiveTopics(
    trends: FetchTrendsResponse['trends']
): Array<{ topic: string; volume: number; platforms: Trend['platform'][] }> {
    const map = new Map<
        string,
        {
            topic: string
            volume: number
            platforms: Set<Trend['platform']>
        }
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
        ?.map((item) => ({
            topic: item.topic,
            volume: item.volume,
            platforms: Array.from(item.platforms),
        }))
        .sort((left, right) => right.volume - left.volume)
}

function sortCrossPlatformSignals(items: CrossPlatformItem[]): CrossPlatformItem[] {
    return [...items].sort((left, right) => {
        if (right.platform_count !== left.platform_count) {
            return right.platform_count - left.platform_count
        }

        return right.total_volume - left.total_volume
    })
}

function RegionStickyHeader({
    regionCode,
    regionOptions,
    onRegionChange,
}: {
    regionCode: string | undefined
    regionOptions: Array<{ value: string; label: string }>
    onRegionChange: (nextRegion: string) => void
}) {
    return (
        <Card
            style={{
                position: 'sticky',
                top: 8,
                zIndex: 4,
            }}
            styles={{ body: { padding: 14 } }}
        >
            <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }} wrap>
                <Space direction="vertical" size={0}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Dashboard
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Region-aware live signals and saved-data insights.
                    </Typography.Text>
                </Space>

                <Space wrap style={{ maxWidth: '100%' }}>
                    <Typography.Text strong>Region</Typography.Text>
                    <Select
                        style={{ maxWidth: '100%', minWidth: 180, width: 240 }}
                        value={regionCode}
                        options={regionOptions}
                        placeholder="Select region"
                        onChange={onRegionChange}
                    />
                </Space>
            </Space>
        </Card>
    )
}

export function DashboardPage() {
    const navigate = useNavigate()
    const [topicsViewMode, setTopicsViewMode] = useState<TopicViewMode>('youtube')

    const [selectedRegionCode, setSelectedRegionCode] = useState<string | undefined>(() => {
        if (typeof window === 'undefined') return undefined
        const stored = window.localStorage.getItem(DASHBOARD_REGION_STORAGE_KEY)?.trim()
        return stored || undefined
    })

    const {
        data: regionsData,
        isLoading: isRegionsLoading,
        error: regionsError,
        refetch: refetchRegions,
    } = useRegions()

    const regionOptions = useMemo(
        () =>
            (regionsData?.data ?? []).map((region) => ({
                value: region.code,
                label: `${region.name} (${region.code})`,
            })),
        [regionsData?.data]
    )

    const regionCode = useMemo(() => {
        if (selectedRegionCode && regionOptions.some((option) => option.value === selectedRegionCode)) {
            return selectedRegionCode
        }

        return regionOptions[0]?.value
    }, [regionOptions, selectedRegionCode])

    useEffect(() => {
        if (!regionCode) return
        if (selectedRegionCode === regionCode) return
        setSelectedRegionCode(regionCode)
    }, [regionCode, selectedRegionCode])

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!selectedRegionCode) return
        window.localStorage.setItem(DASHBOARD_REGION_STORAGE_KEY, selectedRegionCode)
    }, [selectedRegionCode])

    const trendingVideosQuery = useQuery<TrendingVideosResult>({
        queryKey: ['dashboard', 'youtube-trending-videos', regionCode],
        queryFn: async () =>
            (
                await getTrendingVideos({
                    region_code: regionCode!,
                    max_results: 10,
                    video_type: 'all',
                })
            ).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const youtubeTrendingQuery = useQuery<YoutubeTrendingResponse>({
        queryKey: ['dashboard', 'youtube-trending-topics', regionCode],
        queryFn: async () => (await getTrendingTopics({ region_code: regionCode })).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const liveTrendsQuery = useQuery<FetchTrendsResponse>({
        queryKey: ['dashboard', 'live-trends', regionCode],
        queryFn: async () =>
            (
                await fetchPreviewTrends({
                    region_code: regionCode!,
                    limit: 10,
                })
            ).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const velocityQuery = useQuery<VelocityItem[]>({
        queryKey: ['dashboard', 'velocity', regionCode],
        queryFn: async () => (await getVelocity(regionCode!, 7)).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const crossPlatformQuery = useQuery<CrossPlatformItem[]>({
        queryKey: ['dashboard', 'cross-platform', regionCode],
        queryFn: async () => (await getCrossPlatform(regionCode!, 2)).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const groupedByPlatformQuery = useQuery<TrendsGroupedItem[]>({
        queryKey: ['dashboard', 'grouped-platform', regionCode],
        queryFn: async () => (await getTrendsGrouped(regionCode!, 'platform')).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const groupedByCategoryQuery = useQuery<TrendsGroupedItem[]>({
        queryKey: ['dashboard', 'grouped-category', regionCode],
        queryFn: async () => (await getTrendsGrouped(regionCode!, 'category')).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const outliersQuery = useQuery({
        queryKey: ['dashboard', 'outliers-top'],
        queryFn: async () => getOutliers({ per_page: 5 }),
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const creatorRecommendationsQuery = useQuery<CreatorRecommendation[]>({
        queryKey: ['dashboard', 'creator-recommendations', regionCode],
        queryFn: async () => (await getCreatorRecommendations(regionCode!, { limit: 6 })).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const collectionsQuery = useQuery({
        queryKey: ['dashboard', 'recent-collections'],
        queryFn: async () => getYoutubeCollections(),
        staleTime: DASHBOARD_QUERY_STALE_TIME,
        refetchOnMount: 'always',
    })

    const regionScopedQueries = [
        trendingVideosQuery,
        youtubeTrendingQuery,
        liveTrendsQuery,
        velocityQuery,
        crossPlatformQuery,
        groupedByPlatformQuery,
        groupedByCategoryQuery,
        creatorRecommendationsQuery,
    ]

    const isRegionFetching = regionScopedQueries.some((query) => query.isFetching)
    const isRegionInitialLoading = regionScopedQueries.some((query) => query.isLoading)
    const showRegionOverlay = isRegionFetching && !isRegionInitialLoading

    const trendingVideos = (trendingVideosQuery.data?.videos ?? []).slice(0, 10)

    const youtubeTopics = (youtubeTrendingQuery.data?.trending_topics ?? []).slice(0, 10)
    const liveTopics = useMemo(
        () => aggregateLiveTopics(liveTrendsQuery.data?.trends ?? []).slice(0, 10),
        [liveTrendsQuery.data?.trends]
    )

    const risingTopics = useMemo(
        () =>
            (velocityQuery.data ?? [])
                .filter((item) => item.status === 'new' || item.status === 'rising')
                .sort((left, right) => right.velocity - left.velocity)
                .slice(0, 5),
        [velocityQuery.data]
    )

    const decliningTopics = useMemo(
        () =>
            (velocityQuery.data ?? [])
                .filter((item) => item.status === 'falling')
                .sort((left, right) => left.velocity - right.velocity)
                .slice(0, 5),
        [velocityQuery.data]
    )

    const crossPlatformTopics = useMemo(
        () => sortCrossPlatformSignals(crossPlatformQuery.data ?? []).slice(0, 8),
        [crossPlatformQuery.data]
    )

    const groupedPlatform = groupedByPlatformQuery.data ?? []
    const groupedCategory = groupedByCategoryQuery.data ?? []
    const outlierVideos = outliersQuery.data?.data ?? []

    const creatorRecommendations = creatorRecommendationsQuery.data ?? []

    const recentCollections = useMemo(
        () =>
            [...(collectionsQuery.data?.data ?? [])]
                .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
                .slice(0, 4),
        [collectionsQuery.data?.data]
    )

    if (isRegionsLoading) {
        return <Spin size="large" />
    }

    if (regionsError) {
        return (
            <Card>
                <WidgetError
                    message={resolveErrorMessage(regionsError, 'Could not load regions.')}
                    onRetry={() => {
                        void refetchRegions()
                    }}
                />
            </Card>
        )
    }

    if (!regionCode) {
        return (
            <Card>
                <Empty description="No regions available." />
            </Card>
        )
    }

    const maxGroupedPlatformCount = Math.max(...(groupedPlatform?.map((item) => item.count) ?? [1]), 1)
    const maxGroupedCategoryCount = Math.max(...(groupedCategory?.map((item) => item.count) ?? [1]), 1)

    return (
        <div style={{ minWidth: 0, position: 'relative', width: '100%' }}>
            {showRegionOverlay && (
                <div
                    style={{
                        alignItems: 'center',
                        backdropFilter: 'blur(1px)',
                        background: 'rgba(255, 255, 255, 0.52)',
                        display: 'flex',
                        inset: 0,
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        position: 'absolute',
                        zIndex: 5,
                    }}
                >
                    <Spin size="large" tip="Refreshing dashboard..." />
                </div>
            )}

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <RegionStickyHeader
                    regionCode={regionCode}
                    regionOptions={regionOptions}
                    onRegionChange={setSelectedRegionCode}
                />

                <Typography.Title level={5} style={{ margin: 0 }}>
                    Live Signals
                </Typography.Title>

                <Row gutter={[16, 16]} style={{ marginInline: 0 }}>
                    <Col xs={24} xl={12} style={{ minWidth: 0 }}>
                        <Card>
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                <WidgetHeader
                                    title="YouTube Trending Now"
                                    badgeLabel="YouTube"
                                    badgeVariant="youtube"
                                    onRefresh={() => {
                                        void trendingVideosQuery.refetch()
                                    }}
                                />

                                {trendingVideosQuery.isLoading && <WidgetLoading rows={6} />}

                                {trendingVideosQuery.error && (
                                    <WidgetError
                                        message={resolveErrorMessage(trendingVideosQuery.error, 'Could not load trending videos.')}
                                        onRetry={() => {
                                            void trendingVideosQuery.refetch()
                                        }}
                                    />
                                )}

                                {!trendingVideosQuery.isLoading && !trendingVideosQuery.error && trendingVideos.length === 0 && (
                                    <Empty description="No trending videos available for this region." />
                                )}

                                {!trendingVideosQuery.isLoading &&
                                    !trendingVideosQuery.error &&
                                    trendingVideos?.length > 0 && (
                                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                            {trendingVideos?.map((video, index) => {
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
                                                            <Typography.Text strong style={{ flexShrink: 0, minWidth: 30, whiteSpace: 'nowrap' }}>
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
                                                                    style={{
                                                                        display: 'block',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                        whiteSpace: 'nowrap',
                                                                    }}
                                                                    strong
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
                                                                        <Tag color={outlierTagColor(video.outlier_score)} style={{ marginInlineEnd: 0 }}>
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

                                <Button type="link" onClick={() => navigate('/youtube/trending-videos')} style={{ paddingInline: 0 }}>
                                    See full trending videos
                                </Button>
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} xl={12} style={{ minWidth: 0 }}>
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
                                    value={topicsViewMode}
                                    onChange={setTopicsViewMode}
                                />

                                {topicsViewMode === 'youtube' ? (
                                    <>
                                        {youtubeTrendingQuery.isLoading && <WidgetLoading rows={6} />}
                                        {youtubeTrendingQuery.error && (
                                            <WidgetError
                                                message={resolveErrorMessage(youtubeTrendingQuery.error, 'Could not load YouTube topics.')}
                                                onRetry={() => {
                                                    void youtubeTrendingQuery.refetch()
                                                }}
                                            />
                                        )}
                                        {!youtubeTrendingQuery.isLoading &&
                                            !youtubeTrendingQuery.error &&
                                            youtubeTopics?.length === 0 && <Empty description="No YouTube topics found." />}

                                        {!youtubeTrendingQuery.isLoading &&
                                            !youtubeTrendingQuery.error &&
                                            youtubeTopics?.length > 0 && (
                                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                                    {youtubeTopics?.map((item, index) => (
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
                                                            <Tag color="red" style={{ flexShrink: 0, marginInlineEnd: 0 }} title="YouTube">
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
                                                message={resolveErrorMessage(liveTrendsQuery.error, 'Could not load live trends.')}
                                                onRetry={() => {
                                                    void liveTrendsQuery.refetch()
                                                }}
                                            />
                                        )}
                                        {!liveTrendsQuery.isLoading && !liveTrendsQuery.error && liveTopics?.length === 0 && (
                                            <Empty description="No live trends available." />
                                        )}

                                        {!liveTrendsQuery.isLoading && !liveTrendsQuery.error && liveTopics?.length > 0 && (
                                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                                {liveTopics?.map((item, index) => (
                                                    <div
                                                        key={`${item.topic}-${index}`}
                                                        style={{
                                                            border: '1px solid #f0f0f0',
                                                            borderRadius: 10,
                                                            padding: '8px 10px',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, width: '100%' }}>
                                                            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', minWidth: 0, width: '100%' }}>
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
                                                                <Typography.Text style={{ flexShrink: 0 }} type="secondary">
                                                                    {formatNumber(item.volume)}
                                                                </Typography.Text>
                                                            </div>
                                                            <Space size={[6, 6]} wrap>
                                                                {item.platforms?.map((platform) => (
                                                                    <TrendPlatformPill key={`${item.topic}-${platform}`} platform={platform} />
                                                                ))}
                                                            </Space>
                                                        </div>
                                                    </div>
                                                ))}
                                            </Space>
                                        )}
                                    </>
                                )}

                                <Button type="link" onClick={() => navigate('/trends/explore')} style={{ paddingInline: 0 }}>
                                    Explore full trends
                                </Button>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Typography.Title level={5} style={{ margin: 0 }}>
                    Momentum
                </Typography.Title>

                <Card>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <WidgetHeader
                            title="Trend Velocity"
                            badgeLabel="All Platforms"
                            badgeVariant="all"
                            onRefresh={() => {
                                void velocityQuery.refetch()
                            }}
                        />

                        {velocityQuery.isLoading && <WidgetLoading rows={7} />}

                        {velocityQuery.error && (
                            <WidgetError
                                message={resolveErrorMessage(velocityQuery.error, 'Could not load trend velocity.')}
                                onRetry={() => {
                                    void velocityQuery.refetch()
                                }}
                            />
                        )}

                        {!velocityQuery.isLoading && !velocityQuery.error && (
                            <Row gutter={[16, 16]} style={{ marginInline: 0 }}>
                                <Col xs={24} md={12} style={{ minWidth: 0 }}>
                                    <Card size="small" title="Rising">
                                        {risingTopics.length === 0 ? (
                                            <Typography.Text type="secondary">No rising topics in this window.</Typography.Text>
                                        ) : (
                                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                                {risingTopics?.map((item) => (
                                                    <div
                                                        key={`rising-${item.title}`}
                                                        style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', minWidth: 0, width: '100%' }}
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
                                                            title={item.title}
                                                        >
                                                            {item.title}
                                                        </Typography.Text>
                                                        <Tag color="green" style={{ flexShrink: 0, marginInlineEnd: 0 }}>
                                                            +{Math.abs(item.velocity).toFixed(1)}%
                                                        </Tag>
                                                    </div>
                                                ))}
                                            </Space>
                                        )}
                                    </Card>
                                </Col>

                                <Col xs={24} md={12} style={{ minWidth: 0 }}>
                                    <Card size="small" title="Declining">
                                        {decliningTopics.length === 0 ? (
                                            <Typography.Text type="secondary">No declining topics in this window.</Typography.Text>
                                        ) : (
                                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                                {decliningTopics?.map((item) => (
                                                    <div
                                                        key={`declining-${item.title}`}
                                                        style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', minWidth: 0, width: '100%' }}
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
                                                            title={item.title}
                                                        >
                                                            {item.title}
                                                        </Typography.Text>
                                                        <Tag color="red" style={{ flexShrink: 0, marginInlineEnd: 0 }}>
                                                            -{Math.abs(item.velocity).toFixed(1)}%
                                                        </Tag>
                                                    </div>
                                                ))}
                                            </Space>
                                        )}
                                    </Card>
                                </Col>
                            </Row>
                        )}
                    </Space>
                </Card>

                <Card>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <WidgetHeader
                            title="Cross-Platform Signals"
                            badgeLabel="All Platforms"
                            badgeVariant="all"
                            onRefresh={() => {
                                void crossPlatformQuery.refetch()
                            }}
                        />

                        {crossPlatformQuery.isLoading && <WidgetLoading rows={6} />}

                        {crossPlatformQuery.error && (
                            <WidgetError
                                message={resolveErrorMessage(crossPlatformQuery.error, 'Could not load cross-platform signals.')}
                                onRetry={() => {
                                    void crossPlatformQuery.refetch()
                                }}
                            />
                        )}

                        {!crossPlatformQuery.isLoading && !crossPlatformQuery.error && crossPlatformTopics?.length === 0 && (
                            <Empty description="No cross-platform signals available." />
                        )}

                        {!crossPlatformQuery.isLoading && !crossPlatformQuery.error && crossPlatformTopics?.length > 0 && (
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                {crossPlatformTopics?.map((item) => (
                                    <div
                                        key={`${item.title}-${item.platform_count}`}
                                        style={{
                                            border: '1px solid #f0f0f0',
                                            borderRadius: 10,
                                            padding: '10px 12px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, width: '100%' }}>
                                            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', minWidth: 0, width: '100%' }}>
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
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </Typography.Text>
                                                <Typography.Text style={{ flexShrink: 0 }} type="secondary">
                                                    {formatNumber(item.total_volume)}
                                                </Typography.Text>
                                            </div>

                                            <Space size={[6, 6]} wrap>
                                                {item.platforms.map((platform) => (
                                                    <TrendPlatformPill key={`${item.title}-${platform}`} platform={platform} />
                                                ))}
                                            </Space>
                                        </div>
                                    </div>
                                ))}
                            </Space>
                        )}
                    </Space>
                </Card>

                <Typography.Title level={5} style={{ margin: 0 }}>
                    Saved Data Stats
                </Typography.Title>

                <Row gutter={[16, 16]} style={{ marginInline: 0 }}>
                    <Col xs={24} lg={8} style={{ minWidth: 0 }}>
                        <Card>
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                <WidgetHeader
                                    title="Saved Trends by Platform"
                                    badgeLabel="Saved Trends"
                                    badgeVariant="saved"
                                    onRefresh={() => {
                                        void groupedByPlatformQuery.refetch()
                                    }}
                                />

                                {groupedByPlatformQuery.isLoading && <WidgetLoading rows={5} />}

                                {groupedByPlatformQuery.error && (
                                    <WidgetError
                                        message={resolveErrorMessage(
                                            groupedByPlatformQuery.error,
                                            'Could not load platform grouping.'
                                        )}
                                        onRetry={() => {
                                            void groupedByPlatformQuery.refetch()
                                        }}
                                    />
                                )}

                                {!groupedByPlatformQuery.isLoading &&
                                    !groupedByPlatformQuery.error &&
                                    groupedPlatform.length === 0 && <Empty description="No saved trends yet." />}

                                {!groupedByPlatformQuery.isLoading &&
                                    !groupedByPlatformQuery.error &&
                                    groupedPlatform?.length > 0 && (
                                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                            {groupedPlatform?.map((item, index) => (
                                                <Space key={`${groupedLabel(item, 'platform')}-${index}`} direction="vertical" size={4} style={{ width: '100%' }}>
                                                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', minWidth: 0, width: '100%' }}>
                                                        <Typography.Text
                                                            style={{
                                                                flex: 1,
                                                                marginInlineEnd: 8,
                                                                minWidth: 0,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                            title={groupedLabel(item, 'platform')}
                                                        >
                                                            {groupedLabel(item, 'platform')}
                                                        </Typography.Text>
                                                        <Typography.Text style={{ flexShrink: 0 }}>{item.count}</Typography.Text>
                                                    </div>

                                                    <div
                                                        style={{
                                                            background: '#e5e7eb',
                                                            borderRadius: 999,
                                                            height: 8,
                                                            overflow: 'hidden',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                background: '#0D9488',
                                                                borderRadius: 999,
                                                                height: '100%',
                                                                width: `${Math.max((item.count / maxGroupedPlatformCount) * 100, 2)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </Space>
                                            ))}

                                            <Typography.Text type="secondary">
                                                Total: {groupedTotal(groupedPlatform)} trends saved
                                            </Typography.Text>
                                        </Space>
                                    )}
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8} style={{ minWidth: 0 }}>
                        <Card>
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                <WidgetHeader
                                    title="Saved Trends by Category"
                                    badgeLabel="Saved Trends"
                                    badgeVariant="saved"
                                    onRefresh={() => {
                                        void groupedByCategoryQuery.refetch()
                                    }}
                                />

                                {groupedByCategoryQuery.isLoading && <WidgetLoading rows={5} />}

                                {groupedByCategoryQuery.error && (
                                    <WidgetError
                                        message={resolveErrorMessage(
                                            groupedByCategoryQuery.error,
                                            'Could not load category grouping.'
                                        )}
                                        onRetry={() => {
                                            void groupedByCategoryQuery.refetch()
                                        }}
                                    />
                                )}

                                {!groupedByCategoryQuery.isLoading &&
                                    !groupedByCategoryQuery.error &&
                                    groupedCategory?.length === 0 && <Empty description="No saved trends yet." />}

                                {!groupedByCategoryQuery.isLoading &&
                                    !groupedByCategoryQuery.error &&
                                    groupedCategory?.length > 0 && (
                                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                            {groupedCategory?.map((item, index) => (
                                                <Space key={`${groupedLabel(item, 'category')}-${index}`} direction="vertical" size={4} style={{ width: '100%' }}>
                                                    <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', minWidth: 0, width: '100%' }}>
                                                        <Typography.Text
                                                            style={{
                                                                flex: 1,
                                                                marginInlineEnd: 8,
                                                                minWidth: 0,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                            title={groupedLabel(item, 'category')}
                                                        >
                                                            {groupedLabel(item, 'category')}
                                                        </Typography.Text>
                                                        <Typography.Text style={{ flexShrink: 0 }}>{item.count}</Typography.Text>
                                                    </div>

                                                    <div
                                                        style={{
                                                            background: '#e5e7eb',
                                                            borderRadius: 999,
                                                            height: 8,
                                                            overflow: 'hidden',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                background: '#0D9488',
                                                                borderRadius: 999,
                                                                height: '100%',
                                                                width: `${Math.max((item.count / maxGroupedCategoryCount) * 100, 2)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </Space>
                                            ))}

                                            <Button type="link" onClick={() => navigate('/trends/saved')} style={{ paddingInline: 0 }}>
                                                Browse all trends
                                            </Button>
                                        </Space>
                                    )}
                            </Space>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8} style={{ minWidth: 0 }}>
                        <Card>
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                <WidgetHeader
                                    title="Top Outlier Videos"
                                    badgeLabel="YouTube"
                                    badgeVariant="youtube"
                                    onRefresh={() => {
                                        void outliersQuery.refetch()
                                    }}
                                />

                                {outliersQuery.isLoading && <WidgetLoading rows={5} />}

                                {outliersQuery.error && (
                                    <WidgetError
                                        message={resolveErrorMessage(outliersQuery.error, 'Could not load outliers.')}
                                        onRetry={() => {
                                            void outliersQuery.refetch()
                                        }}
                                    />
                                )}

                                {!outliersQuery.isLoading && !outliersQuery?.error && outlierVideos?.length === 0 && (
                                    <Empty description="No saved outlier videos yet." />
                                )}

                                {!outliersQuery.isLoading && !outliersQuery?.error && outlierVideos?.length > 0 && (
                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                        {outlierVideos?.map((video: Video) => (
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
                                                <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', minWidth: 0, width: '100%' }}>
                                                    <Tag color={outlierTagColor(video.outlier_score)} style={{ flexShrink: 0, marginInlineEnd: 0 }}>
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

                                        <Button type="link" onClick={() => navigate('/youtube/outliers')} style={{ paddingInline: 0 }}>
                                            View all outliers
                                        </Button>
                                    </Space>
                                )}
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Typography.Title level={5} style={{ margin: 0 }}>
                    Ideas and Recommendations
                </Typography.Title>

                <Card>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <WidgetHeader
                            title="Creator Recommendations"
                            badgeLabel="All Platforms"
                            badgeVariant="all"
                            onRefresh={() => {
                                void creatorRecommendationsQuery.refetch()
                            }}
                        />

                        {creatorRecommendationsQuery?.isLoading && <WidgetLoading rows={6} />}

                        {creatorRecommendationsQuery?.error && (
                            <WidgetError
                                message={resolveErrorMessage(
                                    creatorRecommendationsQuery?.error,
                                    'Could not load creator recommendations.'
                                )}
                                onRetry={() => {
                                    void creatorRecommendationsQuery.refetch()
                                }}
                            />
                        )}

                        {!creatorRecommendationsQuery?.isLoading &&
                            !creatorRecommendationsQuery?.error &&
                            creatorRecommendations?.length === 0 && <Empty description="No recommendations available." />}

                        {!creatorRecommendationsQuery?.isLoading &&
                            !creatorRecommendationsQuery?.error &&
                            creatorRecommendations?.length > 0 && (
                                <>
                                    <Row gutter={[12, 12]} style={{ marginInline: 0 }}>
                                        {creatorRecommendations?.map((recommendation, index) => (
                                            <Col key={`${recommendation.title}-${index}`} xs={24} sm={12} xl={8} style={{ minWidth: 0 }}>
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
                                                            title={`#${index + 1} ${recommendation.title}`}
                                                        >
                                                            #{index + 1} {recommendation.title}
                                                        </Typography.Text>

                                                        <Typography.Text type="secondary">
                                                            Score: {recommendation.creator_score}/100
                                                        </Typography.Text>

                                                        <Typography.Text type="secondary">
                                                            Volume: {formatNumber(recommendation.volume)}
                                                        </Typography.Text>

                                                        <Space size={[6, 6]} wrap>
                                                            {recommendation?.platforms?.map((platform) => (
                                                                <TrendPlatformPill key={`${recommendation.title}-${platform}`} platform={platform} />
                                                            ))}
                                                        </Space>

                                                        <Button
                                                            size="small"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/planner/explore?topic=${encodeURIComponent(
                                                                        recommendation.title
                                                                    )}&region_code=${encodeURIComponent(regionCode)}`
                                                                )
                                                            }
                                                        >
                                                            Explore
                                                        </Button>
                                                    </Space>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>

                                    <Button type="link" onClick={() => navigate('/creator')} style={{ paddingInline: 0 }}>
                                        See all recommendations
                                    </Button>
                                </>
                            )}
                    </Space>
                </Card>

                <Typography.Title level={5} style={{ margin: 0 }}>
                    My Collections
                </Typography.Title>

                <Card>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <WidgetHeader
                            title="Recent Collections"
                            badgeLabel="YouTube"
                            badgeVariant="youtube"
                            onRefresh={() => {
                                void collectionsQuery.refetch()
                            }}
                        />

                        {collectionsQuery.isLoading && <WidgetLoading rows={6} />}

                        {collectionsQuery.error && (
                            <WidgetError
                                message={resolveErrorMessage(collectionsQuery.error, 'Could not load recent collections.')}
                                onRetry={() => {
                                    void collectionsQuery.refetch()
                                }}
                            />
                        )}

                        {!collectionsQuery.isLoading && !collectionsQuery.error && recentCollections.length === 0 && (
                            <Empty
                                description="You have not saved any collections yet."
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            >
                                <Button type="primary" onClick={() => navigate('/youtube/search')}>
                                    Start a search
                                </Button>
                            </Empty>
                        )}

                        {!collectionsQuery.isLoading && !collectionsQuery.error && recentCollections.length > 0 && (
                            <>
                                <Row gutter={[12, 12]} style={{ marginInline: 0 }}>
                                    {recentCollections?.map((collection) => (
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
                                                        <Tag color={collectionSourceTagColor(collection.source)} style={{ marginInlineEnd: 0 }}>
                                                            {collection.source}
                                                        </Tag>
                                                        <Tag style={{ marginInlineEnd: 0 }}>{collection.video_count} videos</Tag>
                                                        {collection.topic && <Tag style={{ marginInlineEnd: 0 }}>{collection.topic}</Tag>}
                                                        {collection.region_code && (
                                                            <Tag style={{ marginInlineEnd: 0 }}>{collection.region_code}</Tag>
                                                        )}
                                                    </Space>

                                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                        {formatDate(collection.created_at)}
                                                    </Typography.Text>

                                                    <Space>
                                                        <Button size="small" onClick={() => navigate(`/youtube/collections/${collection.id}`)}>
                                                            View
                                                        </Button>
                                                        <Button size="small" onClick={() => navigate(buildCollectionAddPath(collection))}>
                                                            Add Videos
                                                        </Button>
                                                    </Space>
                                                </Space>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>

                                <Button type="link" onClick={() => navigate('/youtube/collections')} style={{ paddingInline: 0 }}>
                                    View all collections
                                </Button>
                            </>
                        )}
                    </Space>
                </Card>
            </Space>
        </div>
    )
}
