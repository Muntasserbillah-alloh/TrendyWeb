import { useMemo, useState } from 'react'
import {
    Button,
    Card,
    Col,
    Input,
    notification,
    Row,
    Select,
    Segmented,
    Slider,
    Space,
    Tag,
    Typography,
} from 'antd'
import { Search } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSaveYoutubeCollection, useYoutubeSearch } from '../../hooks/useYoutube'
import { EmptyState } from '../../components/EmptyState'
import { ErrorMessage } from '../../components/ErrorMessage'
import { useCategories } from '../../hooks/useCategories'
import { useYoutubeGlobalFilters } from '../../hooks/useYoutubeGlobalFilters'
import { YoutubeFiltersPanel } from '../../components/youtube/YoutubeFiltersPanel'
import { YoutubeSaveCollectionModal } from '../../components/youtube/YoutubeSaveCollectionModal'
import { YoutubeSelectionToolbar } from '../../components/youtube/YoutubeSelectionToolbar'
import { SelectableVideoCard } from '../../components/youtube/SelectableVideoCard'
import { useYoutubeVideoSelection } from '../../hooks/useYoutubeVideoSelection'
import { useAuth } from '../../hooks/useAuth'
import {
    buildYoutubeCollectionDefaultName,
    buildYoutubeSaveVideosPayload,
} from '../../utils/youtubeCollections'
import type { SearchResult, Video } from '../../types'

type SearchVideoType = 'all' | 'shorts' | 'normal'

function videoTypeSummaryLabel(videoType: SearchVideoType): string {
    if (videoType === 'shorts') return 'Showing: Shorts only'
    if (videoType === 'normal') return 'Showing: Normal videos only'
    return 'Showing: All video types'
}

const SEARCH_RESULTS_STORAGE_KEY = 'trendy:youtube:search:last-result'

function getSearchResultStorageKey(userScope?: string | number): string {
    const normalizedUserScope =
        typeof userScope === 'number' || typeof userScope === 'string'
            ? String(userScope).trim()
            : ''

    if (!normalizedUserScope) {
        return `${SEARCH_RESULTS_STORAGE_KEY}:anon`
    }

    return `${SEARCH_RESULTS_STORAGE_KEY}:${normalizedUserScope}`
}

function readStoredSearchResult(userScope?: string | number): SearchResult | null {
    if (typeof window === 'undefined') return null

    try {
        const raw = window.sessionStorage.getItem(getSearchResultStorageKey(userScope))
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<SearchResult>
        if (!Array.isArray(parsed.videos)) return null

        return {
            topic: parsed.topic ?? '',
            region: parsed.region ?? null,
            country_codes_searched: parsed.country_codes_searched ?? [],
            count: parsed.count ?? parsed.videos.length,
            outliers_found: parsed.outliers_found ?? 0,
            video_type_filter: parsed.video_type_filter,
            videos: parsed.videos,
        }
    } catch {
        return null
    }
}

function persistSearchResult(result: SearchResult, userScope?: string | number): void {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(getSearchResultStorageKey(userScope), JSON.stringify(result))
}

export function SearchTab() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { isEditor, user } = useAuth()
    const [topic, setTopic] = useState(() => searchParams.get('topic') ?? '')
    const [maxResults, setMaxResults] = useState(50)
    const [categoryId, setCategoryId] = useState<number | undefined>()
    const [videoType, setVideoType] = useState<SearchVideoType>('all')
    const [activeFilter, setActiveFilter] = useState<'all' | 'outliers'>('all')
    const [result, setResult] = useState<SearchResult | null>(() => readStoredSearchResult(user?.id))
    const [saveDialogOpen, setSaveDialogOpen] = useState(false)

    const preferredCollectionId = useMemo(() => {
        const raw = searchParams.get('append_collection_id')
        if (!raw) return undefined

        const parsed = Number(raw)
        if (!Number.isFinite(parsed) || parsed <= 0) return undefined

        return Math.trunc(parsed)
    }, [searchParams])

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
    const { data: categoriesData } = useCategories()
    const searchMutation = useYoutubeSearch()
    const saveMutation = useSaveYoutubeCollection()

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
    } = useYoutubeVideoSelection('search', allVideos, user?.id)

    const handleSearch = () => {
        if (!topic.trim()) return
        searchMutation.mutate(
            {
                topic: topic.trim(),
                region_code: regionCode,
                max_results: maxResults,
                date_from: dateFrom,
                date_to: dateTo,
                category_id: categoryId,
                video_type: videoType,
            },
            {
                onSuccess: (res) => {
                    setResult(res.data)
                    persistSearchResult(res.data, user?.id)
                },
            }
        )
    }

    const displayVideos: Video[] = useMemo(
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
                topic: result?.topic || topic.trim(),
                regionCode: result?.region ?? regionCode,
                source: 'search',
            }),
        [regionCode, result?.region, result?.topic, topic]
    )

    const countryCodes = result?.country_codes_searched ?? []

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
                    source: 'search' as const,
                    topic: result.topic || undefined,
                    region_code: result.region ?? regionCode,
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

    return (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Row gutter={[12, 12]} align="bottom">
                        <Col flex={1} style={{ minWidth: 220 }}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                                Topic
                            </Typography.Text>
                            <Input
                                size="large"
                                placeholder="Enter a topic to research..."
                                prefix={<Search size={16} />}
                                value={topic}
                                onChange={(event) => setTopic(event.target.value)}
                                onPressEnter={handleSearch}
                            />
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                size="large"
                                loading={searchMutation.isPending}
                                onClick={handleSearch}
                            >
                                Search
                            </Button>
                        </Col>
                    </Row>
                </Space>
            </Card>

            <YoutubeFiltersPanel
                title="Search Filters"
                regionCode={regionCode}
                onRegionChange={setRegionCode}
                dateFrom={dateFrom}
                dateTo={dateTo}
                preset={preset}
                onPresetChange={setPreset}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                extra={
                    <Row gutter={[12, 12]}>
                        <Col xs={24} md={8}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                                Category
                            </Typography.Text>
                            <Select
                                allowClear
                                placeholder="All categories"
                                style={{ width: '100%' }}
                                value={categoryId}
                                onChange={(value) => setCategoryId(value)}
                                options={(categoriesData?.data ?? []).map((category) => ({
                                    value: category.id,
                                    label: category.name,
                                }))}
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                                Max results: {maxResults}
                            </Typography.Text>
                            <Slider
                                min={1}
                                max={200}
                                step={1}
                                value={maxResults}
                                onChange={(value) => setMaxResults(Array.isArray(value) ? value[0] : value)}
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                                Video type
                            </Typography.Text>
                            <Segmented
                                block
                                value={videoType}
                                options={[
                                    { label: 'All', value: 'all' },
                                    { label: 'Shorts (≤60s)', value: 'shorts' },
                                    { label: 'Normal (>60s)', value: 'normal' },
                                ]}
                                onChange={(value) => setVideoType(value as SearchVideoType)}
                            />
                        </Col>
                    </Row>
                }
            />

            {searchMutation.error && (
                <ErrorMessage error={searchMutation.error} onRetry={handleSearch} />
            )}

            {searchMutation.isPending && (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Col key={index} xs={24} sm={12} lg={8}>
                            <Card loading style={{ height: 280 }} />
                        </Col>
                    ))}
                </Row>
            )}

            {!result && !searchMutation.isPending && (
                <EmptyState description="Search for a topic first to discover videos and outliers." />
            )}

            {result && !searchMutation.isPending && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card size="small">
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Typography.Text strong>
                                {result.count} videos found · {result.outliers_found} outliers
                            </Typography.Text>
                            <Typography.Text type="secondary">
                                Searched: {countryCodes.length > 0 ? countryCodes.join(', ') : 'No country breakdown'}
                            </Typography.Text>
                            <Tag color="geekblue" style={{ alignSelf: 'flex-start' }}>
                                {videoTypeSummaryLabel(result.video_type_filter ?? videoType)}
                            </Tag>
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

                    <Space>
                        {(['all', 'outliers'] as const).map((f) => (
                            <Button
                                key={f}
                                type={activeFilter === f ? 'primary' : 'default'}
                                onClick={() => setActiveFilter(f)}
                            >
                                {f === 'all' ? 'All Videos' : 'Outliers Only'}
                            </Button>
                        ))}
                    </Space>

                    {displayVideos.length === 0 ? (
                        <EmptyState
                            description={
                                result.count === 0
                                    ? 'No videos found for this topic/region.'
                                    : 'No videos match this filter.'
                            }
                        />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {displayVideos.map((v) => (
                                <Col key={v.video_id} xs={24} sm={12} lg={8} xl={6}>
                                    <SelectableVideoCard
                                        video={v}
                                        checked={selectedVideoIds.has(v.video_id)}
                                        onCheckedChange={(checked) => toggleSelection(v.video_id, checked)}
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Space>
            )}

            <YoutubeSaveCollectionModal
                open={saveDialogOpen && isEditor}
                isSaving={saveMutation.isPending}
                selectedCount={selectedCount}
                defaultName={defaultCollectionName}
                source="search"
                topic={result?.topic || topic.trim() || undefined}
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
