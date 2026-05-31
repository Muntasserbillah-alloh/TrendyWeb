import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Alert,
    Button,
    Card,
    Col,
    Collapse,
    DatePicker,
    Input,
    InputNumber,
    Pagination as AntPagination,
    Row,
    Select,
    Skeleton,
    Space,
    Table,
    Tag,
    Typography,
    theme as antdTheme,
    notification,
} from 'antd'
import { ExternalLink, Lightbulb, RefreshCw, Save, Search, SlidersHorizontal } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import axios from 'axios'
import dayjs from 'dayjs'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './TrendsExplorerPage.css'
import { EmptyState } from '../../components/EmptyState'
import { PlatformBadge } from '../../components/PlatformBadge'
import { TopRequestLoader } from '../../components/TopRequestLoader'
import { useCategories } from '../../hooks/useCategories'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useAuth } from '../../hooks/useAuth'
import { useRegions } from '../../hooks/useRegions'
import { useFetchPreviewTrends, useSaveSelectedTrends } from '../../hooks/useTrends'
import {
    buildTrendSelectionKey,
    compactQueryParams,
    formatDate,
    formatNumber,
    fromCommaSeparated,
    normalizeDateForApi,
    TREND_SAVE_QUEUE_STORAGE_KEY,
    toCommaSeparated,
} from '../../utils'
import type {
    FetchTrendsParams,
    FetchTrendsResponse,
    SaveTrendsResponse,
    Trend,
    TrendPreviewItem,
} from '../../types'

const { RangePicker } = DatePicker

const FETCH_PLATFORM_OPTIONS: Array<{ label: string; value: Trend['platform'] }> = [
    { label: 'YouTube', value: 'youtube' },
    { label: 'Google Trends', value: 'google_trends' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'Twitter', value: 'twitter' },
]

const PREVIEW_PAGE_SIZE = 20
const SAVE_SELECTION_LIMIT = 100
const TOPIC_INPUT_DEBOUNCE_MS = 480

const FETCH_QUERY_KEYS = [
    'fetch_region_code',
    'fetch_topic',
    'fetch_min_volume',
    'fetch_category',
    'fetch_platforms',
    'fetch_date_from',
    'fetch_date_to',
    'fetch_country_codes',
    'fetch_limit',
]

type TrendFlowState = 'idle' | 'fetching' | 'preview_ready' | 'fetch_error' | 'saving' | 'saved' | 'save_error'
type FetchField = keyof FetchTrendsParams | 'trends'

type PreviewTrendRow = TrendPreviewItem & { key: string }

const FLOW_LABELS: Record<TrendFlowState, { text: string; color: string }> = {
    idle: { text: 'Idle', color: 'default' },
    fetching: { text: 'Fetching', color: 'processing' },
    preview_ready: { text: 'Preview Ready', color: 'blue' },
    fetch_error: { text: 'Fetch Error', color: 'error' },
    saving: { text: 'Saving', color: 'processing' },
    saved: { text: 'Saved', color: 'success' },
    save_error: { text: 'Save Error', color: 'error' },
}

function parseNumberParam(value: string | null): number | undefined {
    if (!value) return undefined
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

function parseInitialFetchForm(searchParams: URLSearchParams): FetchTrendsParams {
    return {
        region_code: searchParams.get('fetch_region_code') ?? '',
        topic: searchParams.get('fetch_topic') ?? undefined,
        min_volume: parseNumberParam(searchParams.get('fetch_min_volume')),
        category: searchParams.get('fetch_category') ?? undefined,
        platforms: fromCommaSeparated(searchParams.get('fetch_platforms')),
        date_from: searchParams.get('fetch_date_from') ?? undefined,
        date_to: searchParams.get('fetch_date_to') ?? undefined,
        country_codes: fromCommaSeparated(searchParams.get('fetch_country_codes')).map((code) => code.toUpperCase()),
        limit: parseNumberParam(searchParams.get('fetch_limit')) ?? 50,
    }
}

function buildFetchQueryParams(params: FetchTrendsParams): Record<string, string | number> {
    return compactQueryParams({
        fetch_region_code: params.region_code,
        fetch_topic: params.topic,
        fetch_min_volume: params.min_volume,
        fetch_category: params.category,
        fetch_platforms: toCommaSeparated(params.platforms),
        fetch_date_from: params.date_from,
        fetch_date_to: params.date_to,
        fetch_country_codes: toCommaSeparated(params.country_codes),
        fetch_limit: params.limit,
    })
}

function parseFieldErrors(payload: unknown): Partial<Record<FetchField, string>> {
    if (!payload || typeof payload !== 'object') return {}

    const data = payload as {
        error?: { fields?: Record<string, string | string[]> }
        errors?: Record<string, string | string[]>
    }

    const fieldSource = data.error?.fields ?? data.errors
    if (!fieldSource || typeof fieldSource !== 'object') return {}

    const next: Partial<Record<FetchField, string>> = {}
    Object.entries(fieldSource).forEach(([field, raw]) => {
        const firstMessage = Array.isArray(raw) ? raw[0] : raw
        if (firstMessage) {
            next[field as FetchField] = String(firstMessage)
        }
    })

    return next
}

function extractApiError(error: unknown): {
    status?: number
    message: string
    fieldErrors: Partial<Record<FetchField, string>>
} {
    if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
            | { error?: { message?: string }; message?: string; errors?: Record<string, string | string[]> }
            | undefined

        return {
            status: error.response?.status,
            message:
                responseData?.error?.message ??
                responseData?.message ??
                error.message ??
                'Request failed. Please try again.',
            fieldErrors: parseFieldErrors(responseData),
        }
    }

    return {
        message: error instanceof Error ? error.message : 'Unknown error',
        fieldErrors: {},
    }
}

function isCanceledRequest(error: unknown): boolean {
    return axios.isAxiosError(error) && error.code === 'ERR_CANCELED'
}

function toPreviewRows(trends: TrendPreviewItem[]): PreviewTrendRow[] {
    return trends.map((trend, index) => ({
        ...trend,
        key: buildTrendSelectionKey(trend, index),
    }))
}

function readQueuedPlannerTrends(): { region_code: string; trends: TrendPreviewItem[] } | null {
    const raw = window.localStorage.getItem(TREND_SAVE_QUEUE_STORAGE_KEY)
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as { region_code?: string; trends?: TrendPreviewItem[] }
        if (!parsed.region_code || !Array.isArray(parsed.trends) || parsed.trends.length === 0) {
            return null
        }

        return {
            region_code: parsed.region_code,
            trends: parsed.trends,
        }
    } catch {
        return null
    }
}

export function TrendsExplorerPage() {
    const { token } = antdTheme.useToken()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const [previewPage, setPreviewPage] = useState(1)
    const [fetchForm, setFetchForm] = useState<FetchTrendsParams>(() => parseInitialFetchForm(searchParams))
    const [topicInput, setTopicInput] = useState(() => searchParams.get('fetch_topic') ?? '')
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<FetchField, string>>>({})
    const [flowState, setFlowState] = useState<TrendFlowState>('idle')
    const [previewData, setPreviewData] = useState<FetchTrendsResponse | null>(null)
    const [previewRows, setPreviewRows] = useState<PreviewTrendRow[]>([])
    const [selectedTrendKeys, setSelectedTrendKeys] = useState<string[]>([])
    const [saveSummary, setSaveSummary] = useState<SaveTrendsResponse | null>(null)

    const fetchAbortRef = useRef<AbortController | null>(null)

    const { data: regionsData } = useRegions()
    const { data: categoriesData } = useCategories()
    const fetchPreviewMutation = useFetchPreviewTrends()
    const saveMutation = useSaveSelectedTrends()
    const { isEditor } = useAuth()
    const debouncedTopicInput = useDebouncedValue(topicInput, TOPIC_INPUT_DEBOUNCE_MS)

    const regions = regionsData?.data ?? []
    const categories = categoriesData?.data ?? []

    const selectedRegion = useMemo(
        () => regions.find((region) => region.code === fetchForm.region_code),
        [regions, fetchForm.region_code]
    )

    const countryCodeOptions = useMemo(
        () =>
            (selectedRegion?.country_codes ?? []).map((code) => ({
                label: code,
                value: code,
            })),
        [selectedRegion]
    )

    useEffect(() => {
        const normalizedTopic = debouncedTopicInput.trim()
        setFetchForm((prev) => {
            const nextTopic = normalizedTopic || undefined
            if (prev.topic === nextTopic) return prev
            return {
                ...prev,
                topic: nextTopic,
            }
        })
    }, [debouncedTopicInput])

    useEffect(() => {
        return () => {
            fetchAbortRef.current?.abort()
        }
    }, [])

    useEffect(() => {
        const queued = readQueuedPlannerTrends()
        if (!queued) return

        const rows = toPreviewRows(queued.trends)
        const platforms = Array.from(new Set(rows.map((row) => row.platform)))

        setFetchForm((prev) => ({
            ...prev,
            region_code: prev.region_code || queued.region_code,
        }))

        setPreviewData({
            region: queued.region_code,
            count: rows.length,
            date: dayjs().format('YYYY-MM-DD'),
            filters_applied: { source: 'planner_explore_queue' },
            platforms_queried: platforms,
            trends: queued.trends,
        })
        setPreviewRows(rows)
        setSelectedTrendKeys(rows.map((row) => row.key))
        setFlowState('preview_ready')

        notification.success({
            message: 'Idea Seeds Imported',
            description: `${rows.length} explored trends are ready to save.`,
        })

        window.localStorage.removeItem(TREND_SAVE_QUEUE_STORAGE_KEY)
    }, [])

    const setFetchField = <K extends keyof FetchTrendsParams>(key: K, value: FetchTrendsParams[K]) => {
        setFetchForm((prev) => ({ ...prev, [key]: value }))
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next[key]
            return next
        })
    }

    const syncQueryFromFetchParams = useCallback(
        (params: FetchTrendsParams) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev)
                    FETCH_QUERY_KEYS.forEach((key) => next.delete(key))

                    const query = buildFetchQueryParams(params)
                    Object.entries(query).forEach(([key, value]) => next.set(key, String(value)))

                    if (next.toString() === prev.toString()) return prev
                    return next
                },
                { replace: true }
            )
        },
        [setSearchParams]
    )

    const executePreviewFetch = useCallback(
        async (params: FetchTrendsParams) => {
            if (!params.region_code) {
                setFieldErrors((prev) => ({ ...prev, region_code: 'Region is required.' }))
                setFlowState('fetch_error')
                return
            }

            const normalizedParams: FetchTrendsParams = {
                ...params,
                country_codes: (params.country_codes ?? []).map((code) => code.toUpperCase()),
                limit: Math.min(Math.max(params.limit ?? 50, 1), 200),
            }

            fetchAbortRef.current?.abort()
            const abortController = new AbortController()
            fetchAbortRef.current = abortController

            setFlowState('fetching')
            setFieldErrors({})
            setSaveSummary(null)

            try {
                const response = await fetchPreviewMutation.mutateAsync({
                    params: normalizedParams,
                    signal: abortController.signal,
                })

                if (abortController.signal.aborted) return

                const rows = toPreviewRows(response.data.trends ?? [])
                const rowKeySet = new Set(rows.map((row) => row.key))

                setPreviewData(response.data)
                setPreviewRows(rows)
                setPreviewPage(1)
                setSelectedTrendKeys((current) => current.filter((key) => rowKeySet.has(key)))
                setFlowState('preview_ready')
            } catch (err) {
                if (isCanceledRequest(err)) return

                const details = extractApiError(err)
                const isNotFound = details.status === 404
                const notFoundMessage = params.topic
                    ? `No trends were found for "${params.topic}" in ${params.region_code}.`
                    : `No trends were found for region ${params.region_code}.`

                setFieldErrors(details.fieldErrors)
                setFlowState('fetch_error')

                notification.warning({
                    message: 'Preview fetch failed',
                    description: isNotFound ? notFoundMessage : details.message,
                })
            }
        },
        [fetchPreviewMutation]
    )

    const selectedPreviewRows = useMemo(() => {
        const keySet = new Set(selectedTrendKeys)
        return previewRows.filter((row) => keySet.has(row.key))
    }, [previewRows, selectedTrendKeys])

    const overSelectionLimit = selectedPreviewRows.length > SAVE_SELECTION_LIMIT

    const pagedPreviewRows = useMemo(() => {
        const start = (previewPage - 1) * PREVIEW_PAGE_SIZE
        return previewRows.slice(start, start + PREVIEW_PAGE_SIZE)
    }, [previewPage, previewRows])

    const activeFiltersCount = useMemo(() => {
        const hasTopic = topicInput.trim().length > 0
        const hasRegion = Boolean(fetchForm.region_code)
        const hasPlatforms = (fetchForm.platforms?.length ?? 0) > 0
        const hasCategory = Boolean(fetchForm.category)
        const hasMinVolume = typeof fetchForm.min_volume === 'number'
        const hasCountryCodes = (fetchForm.country_codes?.length ?? 0) > 0
        const hasDateRange = Boolean(fetchForm.date_from && fetchForm.date_to)
        const hasCustomLimit = (fetchForm.limit ?? 50) !== 50

        return [
            hasTopic,
            hasRegion,
            hasPlatforms,
            hasCategory,
            hasMinVolume,
            hasCountryCodes,
            hasDateRange,
            hasCustomLimit,
        ].filter(Boolean).length
    }, [fetchForm, topicInput])

    const selectionCoverage = previewRows.length
        ? Math.round((selectedPreviewRows.length / previewRows.length) * 100)
        : 0
    const normalizedTopicInput = topicInput.trim()
    const debouncedTopicValue = fetchForm.topic ?? ''
    const isTopicDebouncing = normalizedTopicInput !== debouncedTopicValue

    const resolveSearchParams = useCallback((): FetchTrendsParams => {
        const normalizedTopic = topicInput.trim()
        return {
            ...fetchForm,
            topic: normalizedTopic || undefined,
        }
    }, [fetchForm, topicInput])

    const handleFetchPreview = () => {
        const params = resolveSearchParams()
        setFetchForm((prev) => ({
            ...prev,
            topic: params.topic,
        }))
        syncQueryFromFetchParams(params)
        void executePreviewFetch(params)
    }

    const handleRetryFetch = () => {
        const params = resolveSearchParams()
        syncQueryFromFetchParams(params)
        void executePreviewFetch(params)
    }

    const handleSaveSelected = () => {
        if (!isEditor) {
            setFieldErrors((prev) => ({
                ...prev,
                trends: "You don't have permission to save trends.",
            }))
            setFlowState('save_error')
            return
        }

        if (!fetchForm.region_code) {
            setFieldErrors((prev) => ({ ...prev, region_code: 'Region is required before saving.' }))
            setFlowState('save_error')
            return
        }

        if (selectedPreviewRows.length === 0) {
            setFieldErrors((prev) => ({ ...prev, trends: 'Select at least one trend to save.' }))
            setFlowState('save_error')
            return
        }

        if (selectedPreviewRows.length > SAVE_SELECTION_LIMIT) {
            setFieldErrors((prev) => ({
                ...prev,
                trends: `You can save up to ${SAVE_SELECTION_LIMIT} selected trends at a time.`,
            }))
            setFlowState('save_error')
            return
        }

        setFlowState('saving')
        setFieldErrors((prev) => {
            const next = { ...prev }
            delete next.trends
            return next
        })

        saveMutation.mutate(
            {
                region_code: fetchForm.region_code,
                trends: selectedPreviewRows.map(({ key: _key, ...trend }) => ({
                    ...trend,
                    volume: trend.volume ?? null,
                    rank: trend.rank ?? null,
                    url: trend.url ?? null,
                    category_name: trend.category_name ?? null,
                    trend_date: normalizeDateForApi(trend.trend_date),
                })),
            },
            {
                onSuccess: (response) => {
                    setFlowState('saved')
                    setSaveSummary(response.data)
                    notification.success({
                        message: 'Selected trends saved',
                        description: `${response.data.count} trends saved for ${response.data.region}.`,
                    })
                },
                onError: (err) => {
                    const details = extractApiError(err)
                    setFieldErrors((prev) => ({ ...prev, ...details.fieldErrors }))
                    setFlowState('save_error')
                    notification.warning({
                        message: 'Save failed',
                        description: details.message,
                    })
                },
            }
        )
    }

    const handleResetFetchFilters = () => {
        fetchAbortRef.current?.abort()
        setPreviewRows([])
        setSelectedTrendKeys([])
        setPreviewData(null)
        setSaveSummary(null)
        setFieldErrors({})
        setFlowState('idle')
        setTopicInput('')
        setFetchForm({
            region_code: '',
            limit: 50,
        })

        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev)
                FETCH_QUERY_KEYS.forEach((key) => next.delete(key))
                if (next.toString() === prev.toString()) return prev
                return next
            },
            { replace: true }
        )
    }

    const handleSelectAllOnPage = () => {
        const pageKeys = pagedPreviewRows.map((row) => row.key)
        const merged = new Set([...selectedTrendKeys, ...pageKeys])
        setSelectedTrendKeys(Array.from(merged))
    }

    const handleClearSelection = () => {
        setSelectedTrendKeys([])
    }

    const handleSelectBestForSave = () => {
        const sortedByVolume = [...previewRows].sort((a, b) => (b.volume ?? -1) - (a.volume ?? -1))
        const nextSelection = sortedByVolume.slice(0, SAVE_SELECTION_LIMIT).map((row) => row.key)
        setSelectedTrendKeys(nextSelection)

        if (previewRows.length > SAVE_SELECTION_LIMIT) {
            notification.info({
                message: 'Selection capped',
                description: `Top ${SAVE_SELECTION_LIMIT} trends by volume were selected to meet save limits.`,
            })
        }
    }

    const previewColumns: ColumnsType<PreviewTrendRow> = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            render: (title: string, record) => (
                <Space size={8} align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text>{title}</Typography.Text>
                    {record.url && (
                        <a
                            href={record.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open source URL for ${record.title}`}
                            style={{ color: '#8c8c8c', flexShrink: 0 }}
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </Space>
            ),
        },
        {
            title: 'Platform',
            dataIndex: 'platform',
            key: 'platform',
            width: 140,
            render: (platform: Trend['platform']) => <PlatformBadge platform={platform} />,
        },
        {
            title: 'Volume',
            dataIndex: 'volume',
            key: 'volume',
            width: 110,
            align: 'right',
            render: (value: number | null) => formatNumber(value),
        },
        {
            title: 'Category',
            dataIndex: 'category_name',
            key: 'category_name',
            width: 160,
            render: (categoryName: string | null) =>
                categoryName || <Typography.Text type="secondary">Uncategorized</Typography.Text>,
        },
        {
            title: 'Date',
            dataIndex: 'trend_date',
            key: 'trend_date',
            width: 150,
            render: (dateValue: string) => formatDate(dateValue),
        },
        {
            title: 'Action',
            key: 'action',
            width: 170,
            render: (_unused, record) => (
                <Button
                    size="small"
                    icon={<Lightbulb size={14} />}
                    onClick={() =>
                        navigate(
                            `/planner?seed_topic=${encodeURIComponent(record.title)}&region_code=${encodeURIComponent(fetchForm.region_code || '')}`
                        )
                    }
                >
                    Use in Idea Seed
                </Button>
            ),
        },
    ]

    const isFetchingPreview = flowState === 'fetching'
    const isSavingSelection = flowState === 'saving'

    return (
        <div className="trends-explorer-page">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <TopRequestLoader loading={isFetchingPreview || isSavingSelection} />

                <div className="trends-hero-card">
                    <div>
                        <Typography.Title level={3} style={{ margin: 0 }}>
                            Trend Intelligence Studio
                        </Typography.Title>
                        <Typography.Text type="secondary">
                            Search faster, validate the signal, and save only trends worth acting on.
                        </Typography.Text>
                        <Space size={[8, 8]} wrap style={{ marginTop: 12 }}>
                            <Tag color="blue">Active filters: {activeFiltersCount}</Tag>
                            <Tag color={previewRows.length > 0 ? 'green' : 'default'}>
                                Preview rows: {previewRows.length}
                            </Tag>
                            <Tag color="geekblue">Selection: {selectionCoverage}%</Tag>
                        </Space>
                    </div>

                    <div className="trends-hero-state">
                        <Tag color={FLOW_LABELS[flowState].color}>{FLOW_LABELS[flowState].text}</Tag>
                        <Typography.Text type="secondary">
                            {previewData?.date ? `Last fetch: ${formatDate(previewData.date)}` : 'No preview fetched yet'}
                        </Typography.Text>
                    </div>
                </div>

                <Card className="trends-stage-card" title="Step 1: Search Criteria">
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Typography.Text type="secondary">
                            Start with region and topic, then open advanced filters if you need tighter targeting.
                        </Typography.Text>

                        <Row gutter={[12, 12]} align="top">
                            <Col xs={24} md={12} lg={8}>
                                <Typography.Text strong>Region *</Typography.Text>
                                <Select
                                    placeholder="Select region"
                                    aria-label="Select region"
                                    style={{ width: '100%', marginTop: 4 }}
                                    value={fetchForm.region_code || undefined}
                                    onChange={(value) => setFetchField('region_code', value)}
                                    options={regions.map((region) => ({ value: region.code, label: region.name }))}
                                />
                                {fieldErrors.region_code && (
                                    <Typography.Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                                        {fieldErrors.region_code}
                                    </Typography.Text>
                                )}
                            </Col>

                            <Col xs={24} md={12} lg={8}>
                                <Typography.Text strong>Topic</Typography.Text>
                                <Input
                                    placeholder="e.g., AI shorts"
                                    aria-label="Topic keyword"
                                    style={{ marginTop: 4 }}
                                    value={topicInput}
                                    onChange={(event) => {
                                        setTopicInput(event.target.value)
                                        setFieldErrors((prev) => {
                                            if (!prev.topic) return prev
                                            const next = { ...prev }
                                            delete next.topic
                                            return next
                                        })
                                    }}
                                    onPressEnter={handleFetchPreview}
                                />
                                {isTopicDebouncing && (
                                    <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                                        Optimizing input with {TOPIC_INPUT_DEBOUNCE_MS}ms debounce...
                                    </Typography.Text>
                                )}
                                {fieldErrors.topic && (
                                    <Typography.Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                                        {fieldErrors.topic}
                                    </Typography.Text>
                                )}
                            </Col>

                            <Col xs={24} md={12} lg={8}>
                                <Typography.Text strong>Platforms</Typography.Text>
                                <Select
                                    mode="multiple"
                                    allowClear
                                    aria-label="Platform filters"
                                    style={{ width: '100%', marginTop: 4 }}
                                    value={fetchForm.platforms}
                                    onChange={(values) => setFetchField('platforms', values as Trend['platform'][])}
                                    options={FETCH_PLATFORM_OPTIONS}
                                    placeholder="Select one or more"
                                />
                                {fieldErrors.platforms && (
                                    <Typography.Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                                        {fieldErrors.platforms}
                                    </Typography.Text>
                                )}
                            </Col>
                        </Row>

                        <Collapse
                            ghost
                            items={[
                                {
                                    key: 'advanced',
                                    label: (
                                        <Space size={8}>
                                            <SlidersHorizontal size={14} />
                                            Advanced Filters
                                        </Space>
                                    ),
                                    children: (
                                        <Row gutter={[12, 12]} align="top" style={{ marginTop: 4 }}>
                                            <Col xs={24} md={12} lg={8}>
                                                <Typography.Text strong>Category</Typography.Text>
                                                <Select
                                                    placeholder="Optional category"
                                                    allowClear
                                                    aria-label="Category"
                                                    style={{ width: '100%', marginTop: 4 }}
                                                    value={fetchForm.category}
                                                    onChange={(value) => setFetchField('category', value)}
                                                    options={categories.map((category) => ({ value: category.name, label: category.name }))}
                                                />
                                                {fieldErrors.category && (
                                                    <Typography.Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                                                        {fieldErrors.category}
                                                    </Typography.Text>
                                                )}
                                            </Col>

                                            <Col xs={24} md={12} lg={8}>
                                                <Typography.Text strong>Min Volume</Typography.Text>
                                                <InputNumber
                                                    style={{ width: '100%', marginTop: 4 }}
                                                    min={0}
                                                    value={fetchForm.min_volume}
                                                    onChange={(value) => setFetchField('min_volume', value ?? undefined)}
                                                    placeholder="Optional"
                                                    aria-label="Minimum volume"
                                                />
                                            </Col>

                                            <Col xs={24} md={12} lg={8}>
                                                <Typography.Text strong>Country Codes</Typography.Text>
                                                <Select
                                                    mode="tags"
                                                    aria-label="Country code filters"
                                                    style={{ width: '100%', marginTop: 4 }}
                                                    value={fetchForm.country_codes}
                                                    onChange={(values) =>
                                                        setFetchField(
                                                            'country_codes',
                                                            values.map((value) => String(value).toUpperCase())
                                                        )
                                                    }
                                                    options={countryCodeOptions}
                                                    placeholder="e.g., US, EG"
                                                />
                                            </Col>

                                            <Col xs={24} md={12} lg={8}>
                                                <Typography.Text strong>Date Range</Typography.Text>
                                                <RangePicker
                                                    aria-label="Preview date range"
                                                    style={{ width: '100%', marginTop: 4 }}
                                                    value={
                                                        fetchForm.date_from && fetchForm.date_to
                                                            ? [dayjs(fetchForm.date_from), dayjs(fetchForm.date_to)]
                                                            : null
                                                    }
                                                    onChange={(dates) => {
                                                        if (!dates || !dates[0] || !dates[1]) {
                                                            setFetchField('date_from', undefined)
                                                            setFetchField('date_to', undefined)
                                                            return
                                                        }

                                                        setFetchField('date_from', dates[0].format('YYYY-MM-DD'))
                                                        setFetchField('date_to', dates[1].format('YYYY-MM-DD'))
                                                    }}
                                                />
                                            </Col>

                                            <Col xs={24} md={12} lg={8}>
                                                <Typography.Text strong>Limit (1-200)</Typography.Text>
                                                <InputNumber
                                                    min={1}
                                                    max={200}
                                                    style={{ width: '100%', marginTop: 4 }}
                                                    value={fetchForm.limit ?? 50}
                                                    onChange={(value) => setFetchField('limit', value ?? 50)}
                                                    aria-label="Fetch limit"
                                                />
                                            </Col>
                                        </Row>
                                    ),
                                },
                            ]}
                        />

                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<Search size={14} />}
                                loading={isFetchingPreview}
                                onClick={handleFetchPreview}
                            >
                                Search Trends
                            </Button>
                            <Button onClick={handleResetFetchFilters} disabled={isFetchingPreview || isSavingSelection}>
                                Reset Preview Filters
                            </Button>
                            <Button icon={<RefreshCw size={14} />} onClick={handleRetryFetch} disabled={isFetchingPreview}>
                                Retry Last Search
                            </Button>
                        </Space>
                    </Space>
                </Card>

                <Card className="trends-stage-card" title="Step 2: Review and Save Selected Trends" bodyStyle={{ paddingBottom: 0 }}>
                    {flowState === 'idle' && (
                        <EmptyState description="Start with Step 1. Search a preview first, then select trends to save." />
                    )}

                    {isFetchingPreview && previewRows.length === 0 && <Skeleton active title paragraph={{ rows: 8 }} />}

                    {flowState === 'fetch_error' && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Preview could not be loaded"
                            description="Adjust filters and retry. If this is a network issue, retry will safely re-run the latest request."
                            action={
                                <Button size="small" onClick={handleRetryFetch}>
                                    Retry
                                </Button>
                            }
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    {!!previewRows.length && (
                        <>
                            <div className="trends-preview-metrics">
                                <div className="trends-preview-metric">
                                    <Typography.Text type="secondary">Region</Typography.Text>
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                        {previewData?.region || fetchForm.region_code || 'N/A'}
                                    </Typography.Title>
                                </div>
                                <div className="trends-preview-metric">
                                    <Typography.Text type="secondary">Preview trends</Typography.Text>
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                        {previewData?.count ?? previewRows.length}
                                    </Typography.Title>
                                </div>
                                <div className="trends-preview-metric">
                                    <Typography.Text type="secondary">Selected</Typography.Text>
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                        {selectedPreviewRows.length}
                                    </Typography.Title>
                                </div>
                                <div className="trends-preview-metric">
                                    <Typography.Text type="secondary">Coverage</Typography.Text>
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                        {selectionCoverage}%
                                    </Typography.Title>
                                </div>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <Space size={12} wrap>
                                    {previewData?.date && (
                                        <Typography.Text type="secondary">Fetched {formatDate(previewData.date)}</Typography.Text>
                                    )}
                                    {(previewData?.platforms_queried ?? []).map((platform) => (
                                        <PlatformBadge key={`preview-${platform}`} platform={platform} />
                                    ))}
                                </Space>
                            </div>

                            <Table
                                dataSource={pagedPreviewRows}
                                columns={previewColumns}
                                rowKey="key"
                                loading={isFetchingPreview && previewRows.length > 0}
                                pagination={false}
                                rowSelection={{
                                    selectedRowKeys: selectedTrendKeys,
                                    onChange: (keys) => setSelectedTrendKeys(keys.map((key) => String(key))),
                                    columnTitle: 'Select',
                                }}
                                scroll={{ x: 980 }}
                            />

                            {previewRows.length > PREVIEW_PAGE_SIZE && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                                    <AntPagination
                                        current={previewPage}
                                        pageSize={PREVIEW_PAGE_SIZE}
                                        total={previewRows.length}
                                        onChange={setPreviewPage}
                                        showSizeChanger={false}
                                    />
                                </div>
                            )}

                            <div
                                className="trends-selection-bar"
                                style={{
                                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                                    background: token.colorBgContainer,
                                    boxShadow: token.boxShadowSecondary,
                                }}
                            >
                                <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <Space wrap>
                                        <Typography.Text strong>{selectedPreviewRows.length} selected</Typography.Text>
                                        <Tag color={overSelectionLimit ? 'error' : 'green'}>Max {SAVE_SELECTION_LIMIT}</Tag>
                                        <Button size="small" onClick={handleSelectAllOnPage}>
                                            Select all on page
                                        </Button>
                                        <Button size="small" onClick={handleSelectBestForSave}>
                                            Select best by volume
                                        </Button>
                                        <Button size="small" onClick={handleClearSelection}>
                                            Clear selection
                                        </Button>
                                    </Space>

                                    <Button
                                        type="primary"
                                        icon={<Save size={14} />}
                                        onClick={handleSaveSelected}
                                        loading={isSavingSelection}
                                        disabled={selectedPreviewRows.length === 0 || overSelectionLimit || !isEditor}
                                    >
                                        Save Selected
                                    </Button>
                                </Space>

                                {(fieldErrors.trends || overSelectionLimit) && (
                                    <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
                                        {fieldErrors.trends ?? `Selection exceeds ${SAVE_SELECTION_LIMIT}. Reduce selected trends before saving.`}
                                    </Typography.Text>
                                )}
                            </div>
                        </>
                    )}

                    {flowState === 'preview_ready' && previewRows.length === 0 && (
                        <EmptyState description="No trends found for this filter set. Try broadening topic or lowering min volume, then search again." />
                    )}

                    {flowState === 'save_error' && (
                        <Alert
                            type="error"
                            showIcon
                            message="Save failed"
                            description="Retry with fewer selections or fix invalid fields, then save again."
                            style={{ marginTop: 16 }}
                        />
                    )}

                    {saveSummary && flowState === 'saved' && (
                        <Alert
                            type="success"
                            showIcon
                            message="Save complete"
                            description={`${saveSummary.count} trends saved for ${saveSummary.region} on ${formatDate(saveSummary.date)}.`}
                            style={{ marginTop: 16, marginBottom: 16 }}
                        />
                    )}
                </Card>
            </Space>
        </div>
    )
}
