import { useMemo, useState } from 'react'
import {
    Button,
    Card,
    Col,
    notification,
    Row,
    Select,
    Segmented,
    Slider,
    Space,
    Statistic,
    Tag,
    Typography,
} from 'antd'
import { Globe } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSaveYoutubeCollection, useTrendingVideos } from '../../hooks/useYoutube'
import { useCategories } from '../../hooks/useCategories'
import { useRegions } from '../../hooks/useRegions'
import { SelectableVideoCard } from '../../components/youtube/SelectableVideoCard'
import { YoutubeSaveCollectionModal } from '../../components/youtube/YoutubeSaveCollectionModal'
import { YoutubeSelectionToolbar } from '../../components/youtube/YoutubeSelectionToolbar'
import { EmptyState } from '../../components/EmptyState'
import { ErrorMessage } from '../../components/ErrorMessage'
import { useYoutubeVideoSelection } from '../../hooks/useYoutubeVideoSelection'
import { useAuth } from '../../hooks/useAuth'
import {
    buildYoutubeCollectionDefaultName,
    buildYoutubeSaveVideosPayload,
} from '../../utils/youtubeCollections'
import type { TrendingVideo, TrendingVideosResult } from '../../types'

type VideoTypeFilter = 'all' | 'shorts' | 'normal'

const VIDEO_TYPE_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Shorts', value: 'shorts' },
    { label: 'Normal', value: 'normal' },
]

function videoTypeLabel(vt: VideoTypeFilter): string {
    if (vt === 'shorts') return 'Shorts only'
    if (vt === 'normal') return 'Normal videos only'
    return 'All video types'
}

function CountryCodeTag({ code }: { code?: string }) {
    if (!code) return null
    return (
        <Tag icon={<Globe size={11} style={{ marginRight: 2, verticalAlign: 'middle' }} />} color="geekblue" style={{ fontSize: 11, margin: 0 }}>
            {code}
        </Tag>
    )
}

const TRENDING_RESULTS_STORAGE_KEY = 'trendy:youtube:trending-videos:last-result'

function getTrendingResultStorageKey(userScope?: string | number): string {
    const normalizedUserScope =
        typeof userScope === 'number' || typeof userScope === 'string'
            ? String(userScope).trim()
            : ''

    if (!normalizedUserScope) {
        return `${TRENDING_RESULTS_STORAGE_KEY}:anon`
    }

    return `${TRENDING_RESULTS_STORAGE_KEY}:${normalizedUserScope}`
}

function readStoredTrendingResult(userScope?: string | number): TrendingVideosResult | null {
    if (typeof window === 'undefined') return null

    try {
        const raw = window.sessionStorage.getItem(getTrendingResultStorageKey(userScope))
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<TrendingVideosResult>
        if (!Array.isArray(parsed.videos)) return null
        if (typeof parsed.region !== 'string' || parsed.region.trim().length === 0) return null

        return {
            region: parsed.region,
            country_codes_searched: parsed.country_codes_searched ?? [],
            count: parsed.count ?? parsed.videos.length,
            outliers_found: parsed.outliers_found ?? 0,
            video_type_filter: parsed.video_type_filter ?? 'all',
            videos: parsed.videos,
        }
    } catch {
        return null
    }
}

function persistTrendingResult(result: TrendingVideosResult, userScope?: string | number): void {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(getTrendingResultStorageKey(userScope), JSON.stringify(result))
}

export function TrendingVideosTab() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { isEditor, user } = useAuth()
    const [selectedRegionCode, setSelectedRegionCode] = useState<string | undefined>()
    const [categoryId, setCategoryId] = useState<number | undefined>()
    const [videoType, setVideoType] = useState<VideoTypeFilter>('all')
    const [maxResults, setMaxResults] = useState(50)
    const [activeFilter, setActiveFilter] = useState<'all' | 'outliers'>('all')
    const [result, setResult] = useState<TrendingVideosResult | null>(() =>
        readStoredTrendingResult(user?.id)
    )
    const [saveDialogOpen, setSaveDialogOpen] = useState(false)

    const preferredCollectionId = useMemo(() => {
        const raw = searchParams.get('append_collection_id')
        if (!raw) return undefined

        const parsed = Number(raw)
        if (!Number.isFinite(parsed) || parsed <= 0) return undefined

        return Math.trunc(parsed)
    }, [searchParams])

    const { data: regionsData, isLoading: isRegionsLoading } = useRegions()
    const { data: categoriesData } = useCategories()
    const trendingMutation = useTrendingVideos()
    const saveMutation = useSaveYoutubeCollection()

    const regionOptions = useMemo(
        () =>
            (regionsData?.data ?? []).map((region) => ({
                value: region.code,
                label: region.name,
            })),
        [regionsData?.data]
    )

    const allVideos = useMemo(() => result?.videos ?? [], [result?.videos])
    const {
        selectedVideoIds,
        selectedVideos,
        selectedCount,
        toggleSelection,
        clearSelection,
        selectAll,
        selectOutliersOnly,
        invertSelection,
    } = useYoutubeVideoSelection('trending-videos', allVideos, user?.id)

    const categoryOptions = useMemo(
        () =>
            categoriesData?.data.map((cat) => ({
                value: cat.id,
                label: cat.name,
            })) ?? [],
        [categoriesData]
    )

    const regionCode =
        (selectedRegionCode && regionOptions.some((option) => option.value === selectedRegionCode)
            ? selectedRegionCode
            : undefined) ??
        (result?.region && regionOptions.some((option) => option.value === result.region)
            ? result.region
            : undefined) ??
        regionOptions[0]?.value

    const handleFetch = () => {
        if (!regionCode) {
            void notification.warning({
                message: 'Please select a region first.',
            })
            return
        }

        trendingMutation.mutate(
            {
                region_code: regionCode,
                max_results: maxResults,
                category_id: categoryId,
                video_type: videoType,
            },
            {
                onSuccess: (res) => {
                    setResult(res.data)
                    persistTrendingResult(res.data, user?.id)
                },
            }
        )
    }

    const displayVideos: TrendingVideo[] = useMemo(
        () => result?.videos.filter((v) => activeFilter === 'all' || v.is_outlier) ?? [],
        [result, activeFilter]
    )
    const outliersCount = useMemo(
        () => allVideos.filter((video) => video.is_outlier).length,
        [allVideos]
    )

    const defaultCollectionName = useMemo(
        () =>
            buildYoutubeCollectionDefaultName({
                topic: 'trending',
                regionCode: result?.region ?? regionCode,
                source: 'trending',
            }),
        [regionCode, result?.region]
    )

    const handleSaveCollection = ({
        mode,
        name,
        description,
        collectionId,
    }: {
        mode: 'new' | 'existing'
        name: string
        description?: string
        collectionId?: number
    }) => {
        if (!result || selectedVideos.length === 0) return

        const videosPayload = buildYoutubeSaveVideosPayload(selectedVideos)

        const savePayload =
            mode === 'existing'
                ? {
                    name,
                    collection_id: collectionId,
                    videos: videosPayload,
                }
                : {
                    name,
                    description,
                    videos: videosPayload,
                    source: 'trending' as const,
                    topic: 'trending',
                    region_code: result.region,
                    category_id: categoryId,
                    video_type_filter: result.video_type_filter ?? videoType,
                }

        saveMutation.mutate(
            savePayload,
            {
                onSuccess: (response) => {
                    setSaveDialogOpen(false)
                    clearSelection()

                    const { action, added_count: addedCount, collection } = response.data
                    const successMessage =
                        action === 'appended'
                            ? `${addedCount} video${addedCount === 1 ? '' : 's'} added to ${collection.name}`
                            : `Collection created with ${addedCount} video${addedCount === 1 ? '' : 's'}`

                    void notification.success({
                        message: successMessage,
                        description: (
                            <Button type="link" size="small" onClick={() => navigate('/youtube/collections')}>
                                View collections
                            </Button>
                        ),
                    })
                },
                onError: (error) => {
                    void notification.error({
                        message: 'Failed to save selected videos',
                        description: error instanceof Error ? error.message : 'Please retry.',
                    })
                },
            }
        )
    }

    const countryCodes = result?.country_codes_searched ?? []

    return (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
            {/* Filters */}
            <Card>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Row gutter={[12, 12]} align="bottom">
                        <Col flex="200px">
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                                Region
                            </Typography.Text>
                            <Select
                                style={{ width: '100%' }}
                                value={regionCode}
                                onChange={setSelectedRegionCode}
                                options={regionOptions}
                                loading={isRegionsLoading}
                                placeholder="Select region"
                            />
                        </Col>
                        <Col flex="220px">
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                                Category (optional)
                            </Typography.Text>
                            <Select
                                style={{ width: '100%' }}
                                allowClear
                                placeholder="All categories"
                                value={categoryId}
                                onChange={setCategoryId}
                                options={categoryOptions}
                            />
                        </Col>
                        <Col flex="260px">
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                                Video Type
                            </Typography.Text>
                            <Segmented
                                options={VIDEO_TYPE_OPTIONS}
                                value={videoType}
                                onChange={(v) => setVideoType(v as VideoTypeFilter)}
                            />
                        </Col>
                        <Col flex="200px">
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                                Max Results: {maxResults}
                            </Typography.Text>
                            <Slider
                                min={1}
                                max={200}
                                step={1}
                                value={maxResults}
                                onChange={(value) => setMaxResults(Array.isArray(value) ? value[0] : value)}
                                style={{ margin: '6px 0 0' }}
                            />
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                size="large"
                                loading={trendingMutation.isPending}
                                onClick={handleFetch}
                            // icon={<Fire size={16} style={{ verticalAlign: 'middle' }} />}
                            >
                                Fetch Trending
                            </Button>
                        </Col>
                    </Row>
                </Space>
            </Card>

            {/* Error */}
            {trendingMutation.isError && (
                <ErrorMessage
                    error={trendingMutation.error}
                    message={(trendingMutation.error as Error)?.message ?? 'Failed to fetch trending videos'}
                    onRetry={handleFetch}
                />
            )}

            {trendingMutation.isPending && (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Col key={index} xs={24} sm={12} md={8} lg={6}>
                            <Card loading style={{ height: 280 }} />
                        </Col>
                    ))}
                </Row>
            )}

            {/* Results */}
            {result && !trendingMutation.isPending && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {/* Summary */}
                    <Card size="small">
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Typography.Text strong>
                                {result.count} videos found · {result.outliers_found} outliers
                            </Typography.Text>
                            <Typography.Text type="secondary">
                                Searched: {countryCodes.length > 0 ? countryCodes.join(', ') : 'No country breakdown'}
                            </Typography.Text>
                            <Tag color="geekblue" style={{ width: 'fit-content' }}>
                                {videoTypeLabel(result.video_type_filter)}
                            </Tag>
                            <Space wrap>
                                <Statistic title="Regions Searched" value={countryCodes.length} />
                            </Space>
                        </Space>
                    </Card>

                    <YoutubeSelectionToolbar
                        totalCount={allVideos.length}
                        selectedCount={selectedCount}
                        outliersCount={outliersCount}
                        onSelectAll={selectAll}
                        onDeselectAll={clearSelection}
                        onSelectOutliersOnly={selectOutliersOnly}
                        onInvertSelection={invertSelection}
                        onSaveSelected={() => {
                            if (!isEditor) {
                                void notification.warning({
                                    message: "You don't have permission to save collections.",
                                })
                                return
                            }

                            setSaveDialogOpen(true)
                        }}
                        saveDisabled={selectedCount < 1 || !isEditor}
                        isSaving={saveMutation.isPending}
                    />

                    {/* Filter toggle */}
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Segmented
                                options={[
                                    { label: `All (${result.count})`, value: 'all' },
                                    { label: `Outliers (${result.outliers_found})`, value: 'outliers' },
                                ]}
                                value={activeFilter}
                                onChange={(v) => setActiveFilter(v as 'all' | 'outliers')}
                            />
                        </Col>
                        <Col>
                            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                                Showing {displayVideos.length} video{displayVideos.length !== 1 ? 's' : ''}
                            </Typography.Text>
                        </Col>
                    </Row>

                    {/* Video grid */}
                    {displayVideos.length === 0 ? (
                        <EmptyState
                            description={
                                result.count === 0
                                    ? 'No videos found for this topic/region.'
                                    : 'No videos match the current filter.'
                            }
                        />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {displayVideos.map((video) => (
                                <Col key={video.video_id} xs={24} sm={12} md={8} lg={6}>
                                    <SelectableVideoCard
                                        video={video}
                                        checked={selectedVideoIds.has(video.video_id)}
                                        onCheckedChange={(checked) => toggleSelection(video.video_id, checked)}
                                        showTags={false}
                                        belowCheckboxOverlay={<CountryCodeTag code={video.country_code} />}
                                        topRightOverlay={
                                            video.outlier_score != null && video.is_outlier ? (
                                                <Tag color="volcano" style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>
                                                    🔥 {video.outlier_score.toFixed(1)}x
                                                </Tag>
                                            ) : null
                                        }
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Space>
            )}

            {/* Initial empty state */}
            {!result && !trendingMutation.isPending && !trendingMutation.isError && (
                <EmptyState description="Select a region and click Fetch Trending to discover what's hot right now." />
            )}

            <YoutubeSaveCollectionModal
                open={saveDialogOpen && isEditor}
                isSaving={saveMutation.isPending}
                selectedCount={selectedCount}
                defaultName={defaultCollectionName}
                source="trending"
                topic="trending"
                regionCode={result?.region ?? regionCode}
                categoryId={categoryId}
                videoTypeFilter={result?.video_type_filter ?? videoType}
                preferredCollectionId={preferredCollectionId}
                onCancel={() => setSaveDialogOpen(false)}
                onSubmit={handleSaveCollection}
            />
        </Space>
    )
}
