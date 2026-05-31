import { useState } from 'react'
import {
    Alert,
    Button,
    Card,
    Col,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Tag,
    Typography,
    notification,
} from 'antd'
import { ExternalLink, Plus, Sparkles } from 'lucide-react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { PlatformBadge } from '../../components/PlatformBadge'
import { Spinner } from '../../components/Spinner'
import { useExploreIdeas } from '../../hooks/usePlanner'
import { useRegions } from '../../hooks/useRegions'
import {
    buildTrendIdentityKey,
    buildTrendSelectionKey,
    formatDate,
    formatNumber,
    TREND_SAVE_QUEUE_STORAGE_KEY,
} from '../../utils'
import type { PlannerExploreGroup, Trend, TrendPreviewItem } from '../../types'

const PLATFORM_OPTIONS = [
    { label: 'YouTube', value: 'youtube' },
    { label: 'Google Trends', value: 'google_trends' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'Twitter', value: 'twitter' },
]

interface SaveQueuePayload {
    region_code: string
    trends: TrendPreviewItem[]
}

function readSaveQueue(): SaveQueuePayload | null {
    const raw = window.localStorage.getItem(TREND_SAVE_QUEUE_STORAGE_KEY)
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as SaveQueuePayload
        if (!parsed.region_code || !Array.isArray(parsed.trends)) return null
        return parsed
    } catch {
        return null
    }
}

function enqueueForSave(regionCode: string, trend: TrendPreviewItem): {
    queue: SaveQueuePayload
    replacedRegion: boolean
    added: boolean
} {
    const existing = readSaveQueue()
    const replacedRegion = !!existing && existing.region_code !== regionCode

    const nextTrends = replacedRegion ? [] : existing?.trends ?? []
    const nextKeys = new Set(nextTrends.map((item) => buildTrendIdentityKey(item)))
    const trendKey = buildTrendIdentityKey(trend)
    const added = !nextKeys.has(trendKey)

    if (added) {
        nextTrends.push(trend)
    }

    const payload: SaveQueuePayload = {
        region_code: regionCode,
        trends: nextTrends,
    }

    window.localStorage.setItem(TREND_SAVE_QUEUE_STORAGE_KEY, JSON.stringify(payload))
    return { queue: payload, replacedRegion, added }
}

function clearSaveQueue(): void {
    window.localStorage.removeItem(TREND_SAVE_QUEUE_STORAGE_KEY)
}

function toErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined
        return data?.error?.message ?? data?.message ?? error.message
    }

    return error instanceof Error ? error.message : 'Unable to explore ideas right now.'
}

export function ExploreTab() {
    const navigate = useNavigate()
    const [topic, setTopic] = useState('')
    const [regionCode, setRegionCode] = useState<string | undefined>()
    const [minVolume, setMinVolume] = useState<number | undefined>()
    const [platforms, setPlatforms] = useState<Trend['platform'][]>([])
    const [limit, setLimit] = useState(40)
    const [inlineError, setInlineError] = useState<string | null>(null)
    const [hasExplored, setHasExplored] = useState(false)
    const [queueInfo, setQueueInfo] = useState<SaveQueuePayload | null>(() => readSaveQueue())

    const { data: regionsData } = useRegions()
    const exploreMutation = useExploreIdeas()

    const groups: PlannerExploreGroup[] = exploreMutation.data?.data.groups ?? []

    const handleExplore = () => {
        const trimmedTopic = topic.trim()
        if (!trimmedTopic || !regionCode) {
            setInlineError('Topic and region are required to explore ideas.')
            return
        }

        setHasExplored(true)
        setInlineError(null)

        exploreMutation.mutate(
            {
                params: {
                    topic: trimmedTopic,
                    region_code: regionCode,
                    min_volume: minVolume,
                    platforms: platforms.length ? platforms : undefined,
                    limit,
                },
            },
            {
                onError: (error) => {
                    setInlineError(toErrorMessage(error))
                    notification.warning({
                        message: 'Explore failed',
                        description: toErrorMessage(error),
                    })
                },
            }
        )
    }

    const handleAddToSaveFlow = (trend: TrendPreviewItem) => {
        if (!regionCode) {
            notification.warning({ message: 'Select a region first' })
            return
        }

        const result = enqueueForSave(regionCode, trend)
        setQueueInfo(result.queue)
        if (result.added) {
            notification.success({
                message: 'Added to Save Flow',
                description: result.replacedRegion
                    ? `Queue switched to ${regionCode} and now has ${result.queue.trends.length} trend.`
                    : `${result.queue.trends.length} trends ready in the Trends save queue.`,
            })
            return
        }

        notification.info({
            message: 'Already queued',
            description: 'This trend is already in your save queue.',
        })
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={12} lg={8}>
                        <Typography.Text strong>Topic *</Typography.Text>
                        <Input
                            placeholder="e.g., faceless AI channels"
                            value={topic}
                            onChange={(event) => setTopic(event.target.value)}
                            onPressEnter={handleExplore}
                            style={{ marginTop: 4 }}
                        />
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                        <Typography.Text strong>Region *</Typography.Text>
                        <Select
                            placeholder="Select region"
                            style={{ width: '100%', marginTop: 4 }}
                            value={regionCode}
                            onChange={setRegionCode}
                            options={(regionsData?.data ?? []).map((region) => ({
                                value: region.code,
                                label: region.name,
                            }))}
                        />
                    </Col>

                    <Col xs={24} md={12} lg={5}>
                        <Typography.Text strong>Min Volume</Typography.Text>
                        <InputNumber
                            min={0}
                            style={{ width: '100%', marginTop: 4 }}
                            value={minVolume}
                            onChange={(value) => setMinVolume(value ?? undefined)}
                        />
                    </Col>

                    <Col xs={24} md={12} lg={5}>
                        <Typography.Text strong>Limit</Typography.Text>
                        <InputNumber
                            min={1}
                            max={200}
                            style={{ width: '100%', marginTop: 4 }}
                            value={limit}
                            onChange={(value) => setLimit(value ?? 40)}
                        />
                    </Col>

                    <Col xs={24}>
                        <Typography.Text strong>Platforms</Typography.Text>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%', marginTop: 4 }}
                            value={platforms}
                            onChange={(values) => setPlatforms(values as Trend['platform'][])}
                            options={PLATFORM_OPTIONS}
                            placeholder="Optional platform focus"
                        />
                    </Col>

                    <Col xs={24}>
                        <Space wrap>
                            <Button
                                type="primary"
                                icon={<Sparkles size={14} />}
                                loading={exploreMutation.isPending}
                                onClick={handleExplore}
                            >
                                Explore Ideas
                            </Button>

                            <Button
                                disabled={!queueInfo?.trends.length}
                                onClick={() =>
                                    navigate(
                                        `/trends/explore?fetch_region_code=${encodeURIComponent(queueInfo?.region_code ?? regionCode ?? '')}`
                                    )
                                }
                            >
                                Open Save Flow ({queueInfo?.trends.length ?? 0})
                            </Button>

                            <Button
                                disabled={!queueInfo?.trends.length}
                                onClick={() => {
                                    clearSaveQueue()
                                    setQueueInfo(null)
                                }}
                            >
                                Clear Queue
                            </Button>
                        </Space>

                        {queueInfo && (
                            <Space size={8} style={{ marginTop: 8 }} wrap>
                                <Tag color="blue">Queue Region: {queueInfo.region_code}</Tag>
                                <Tag color="green">{queueInfo.trends.length} ready to save</Tag>
                            </Space>
                        )}
                    </Col>
                </Row>

                {inlineError && (
                    <Alert
                        type="warning"
                        showIcon
                        message="Could not explore with current filters"
                        description={inlineError}
                        style={{ marginTop: 16 }}
                    />
                )}
            </Card>

            {exploreMutation.isPending && <Spinner tip="Exploring grouped trend ideas..." />}

            {hasExplored && !exploreMutation.isPending && groups.length === 0 && (
                <EmptyState description="No idea groups found. Try lowering min volume or broadening the topic." />
            )}

            {groups.map((group) => (
                <Card
                    key={group.group_name}
                    title={
                        <Space>
                            <Typography.Text strong>{group.group_name}</Typography.Text>
                            <Tag>{group.count} trends</Tag>
                        </Space>
                    }
                >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Typography.Paragraph style={{ margin: 0 }}>
                            {group.description}
                        </Typography.Paragraph>

                        {group.insights?.length > 0 && (
                            <Space wrap>
                                {group.insights.map((insight) => (
                                    <Tag key={insight} color="blue">
                                        {insight}
                                    </Tag>
                                ))}
                            </Space>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {group.trends.map((trend, index) => (
                                <Card key={buildTrendSelectionKey(trend, index)} size="small">
                                    <Row gutter={[10, 10]} align="middle">
                                        <Col xs={24} lg={10}>
                                            <Typography.Text strong>{trend.title}</Typography.Text>
                                        </Col>

                                        <Col xs={24} lg={8}>
                                            <Space wrap>
                                                <PlatformBadge platform={trend.platform} />
                                                <Tag>{formatNumber(trend.volume)} vol</Tag>
                                                <Tag>{formatDate(trend.trend_date)}</Tag>
                                                {trend.category_name && <Tag color="purple">{trend.category_name}</Tag>}
                                            </Space>
                                        </Col>

                                        <Col xs={24} lg={6}>
                                            <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
                                                <Button
                                                    size="small"
                                                    icon={<Plus size={14} />}
                                                    onClick={() => handleAddToSaveFlow(trend)}
                                                >
                                                    Add to Save Flow
                                                </Button>
                                                {trend.url && (
                                                    <a href={trend.url} target="_blank" rel="noopener noreferrer" aria-label={`Open source URL for ${trend.title}`}>
                                                        <Button size="small" icon={<ExternalLink size={14} />}>Open</Button>
                                                    </a>
                                                )}
                                            </Space>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                        </div>
                    </Space>
                </Card>
            ))}
        </Space>
    )
}
