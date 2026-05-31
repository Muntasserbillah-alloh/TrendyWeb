import { useState } from 'react'
import type { ReactNode } from 'react'
import {
    Button,
    Card,
    Col,
    Input,
    Row,
    Slider,
    Space,
    Tag,
    Typography,
    message,
} from 'antd'
import { Clock3, Copy, Rocket, Target } from 'lucide-react'
import { useVideoIdeasWithFilters } from '../../hooks/useYoutube'
import { ErrorMessage } from '../../components/ErrorMessage'
import { formatNumber } from '../../utils'
import { EmptyState } from '../../components/EmptyState'
import { YoutubeFiltersPanel } from '../../components/youtube/YoutubeFiltersPanel'
import { useYoutubeGlobalFilters } from '../../hooks/useYoutubeGlobalFilters'

function getSuggestionMeta(type: string): {
    icon: ReactNode
    borderColor: string
} {
    if (type === 'duration') {
        return { icon: <Clock3 size={16} />, borderColor: '#1677ff' }
    }
    if (type === 'opportunity') {
        return { icon: <Rocket size={16} />, borderColor: '#52c41a' }
    }
    return { icon: <Target size={16} />, borderColor: '#722ed1' }
}

export function VideoIdeasTab() {
    const [inputTopic, setInputTopic] = useState('')
    const [topic, setTopic] = useState<string | undefined>()

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

    const { data, isLoading, error, refetch } = useVideoIdeasWithFilters(topic, {
        region_code: regionCode,
        date_from: dateFrom,
        date_to: dateTo,
    })
    const ideas = data?.data
    const sweetSpot = ideas?.patterns?.optimal_duration?.sweet_spot

    const handleCopy = (text: string) => {
        void navigator.clipboard.writeText(text).then(() => void message.success('Copied!'))
    }

    return (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Row gutter={[12, 12]} align="bottom">
                <Col flex={1} style={{ minWidth: 200 }}>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Topic</Typography.Text>
                    <Input
                        placeholder="e.g. budget travel"
                        value={inputTopic}
                        onChange={(e) => setInputTopic(e.target.value)}
                        onPressEnter={() => setTopic(inputTopic.trim() || undefined)}
                    />
                </Col>
                <Col>
                    <Button type="primary" loading={isLoading} onClick={() => setTopic(inputTopic.trim() || undefined)}>
                        Get Ideas
                    </Button>
                </Col>
            </Row>

            <YoutubeFiltersPanel
                title="Ideas Filters"
                regionCode={regionCode}
                onRegionChange={setRegionCode}
                dateFrom={dateFrom}
                dateTo={dateTo}
                preset={preset}
                onPresetChange={setPreset}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
            />

            {!topic && !isLoading && (
                <EmptyState description="Search for a topic first to generate actionable video ideas." />
            )}

            {isLoading && (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Col key={index} xs={24}>
                            <Card loading style={{ height: 180 }} />
                        </Col>
                    ))}
                </Row>
            )}

            {error && <ErrorMessage error={error} onRetry={() => void refetch()} />}

            {ideas && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                            <Card title="🎯 Target View Range" size="small">
                                <Typography.Title level={3} style={{ margin: 0 }}>
                                    {formatNumber(ideas.patterns?.common_view_range?.min)} - {formatNumber(ideas.patterns?.common_view_range?.max)}
                                </Typography.Title>
                                <Typography.Text type="secondary">
                                    median {formatNumber(ideas.patterns?.common_view_range?.median)} views
                                </Typography.Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Card title="⏱ Duration Sweet Spot" size="small">
                                <Typography.Text type="secondary">
                                    {ideas.patterns?.optimal_duration?.sweet_spot?.min_display} - {ideas.patterns?.optimal_duration?.sweet_spot?.max_display}
                                </Typography.Text>
                                <Slider
                                    range
                                    disabled
                                    value={
                                        sweetSpot
                                            ? [sweetSpot?.min_seconds, sweetSpot?.max_seconds]
                                            : [0, 0]
                                    }
                                    min={0}
                                    max={Math.max((sweetSpot?.max_seconds ?? 0) + 120, 900)}
                                    tooltip={{ open: false }}
                                    style={{ marginTop: 16 }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {ideas.patterns?.high_performing_titles?.length > 0 && (
                        <Card title="🏆 Viral Title Patterns" styles={{ body: { maxHeight: 280, overflowY: 'auto' } }}>
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                {ideas.patterns?.high_performing_titles?.map((title, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 12,
                                            background: '#fafafa',
                                            borderRadius: 8,
                                            padding: '8px 12px',
                                        }}
                                    >
                                        <Typography.Text style={{ flex: 1 }}>{title}</Typography.Text>
                                        <Button size="small" icon={<Copy size={12} />} onClick={() => handleCopy(title)}>
                                            Copy title pattern
                                        </Button>
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    )}

                    <Row gutter={[16, 16]}>
                        {ideas.suggestions?.map((suggestion, index) => {
                            const meta = getSuggestionMeta(suggestion.type)
                            return (
                                <Col xs={24} md={12} key={`${suggestion.type}-${index}`}>
                                    <Card style={{ borderLeft: `4px solid ${meta.borderColor}`, height: '100%' }}>
                                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                            <Space>
                                                {meta.icon}
                                                <Typography.Text strong style={{ textTransform: 'capitalize' }}>
                                                    {suggestion.type}
                                                </Typography.Text>
                                            </Space>
                                            <Typography.Text strong>{suggestion.tip}</Typography.Text>
                                            <Typography.Text type="secondary">{suggestion.reason}</Typography.Text>
                                            {(suggestion.examples?.length ?? 0) > 0 && (
                                                <Space wrap>
                                                    {suggestion.examples?.map((example) => (
                                                        <Tag key={example}>{example}</Tag>
                                                    ))}
                                                </Space>
                                            )}
                                        </Space>
                                    </Card>
                                </Col>
                            )
                        })}
                    </Row>

                    {ideas.patterns?.small_channels_winning?.length > 0 && (
                        <Card title="🚀 Small Channels Winning (Proof)">
                            <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                {ideas.patterns?.small_channels_winning?.map((entry, index) => (
                                    <div
                                        key={`${entry.channel}-${index}`}
                                        style={{
                                            border: '1px solid rgba(5, 5, 5, 0.08)',
                                            borderRadius: 10,
                                            padding: '10px 12px',
                                        }}
                                    >
                                        <Typography.Text strong>{entry.title}</Typography.Text>
                                        <div>
                                            <Typography.Text type="secondary">
                                                {entry.channel} · {formatNumber(entry.subs)} subs · {formatNumber(entry.views)} views
                                            </Typography.Text>
                                        </div>
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    )}

                    {ideas.patterns?.channels_that_went_viral?.length > 0 && (
                        <Card title="Viral Channels">
                            <Space wrap>
                                {ideas.patterns?.channels_that_went_viral?.map((channelName) => (
                                    <Tag key={channelName} color="purple">
                                        {channelName}
                                    </Tag>
                                ))}
                            </Space>
                        </Card>
                    )}
                </Space>
            )}
        </Space>
    )
}
