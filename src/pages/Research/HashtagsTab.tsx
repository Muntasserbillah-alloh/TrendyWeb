import { useMemo, useState } from 'react'
import {
    Button,
    Card,
    Col,
    Input,
    Row,
    Space,
    Tag,
    Typography,
    message,
} from 'antd'
import { Copy } from 'lucide-react'
import { useHashtags } from '../../hooks/useYoutube'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { YoutubeFiltersPanel } from '../../components/youtube/YoutubeFiltersPanel'
import { useYoutubeGlobalFilters } from '../../hooks/useYoutubeGlobalFilters'

export function HashtagsTab() {
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

    const { data, isLoading, error, refetch } = useHashtags(topic, {
        region_code: regionCode,
        date_from: dateFrom,
        date_to: dateTo,
    })

    const hashtagsData = data?.data

    const tagCloudItems = useMemo(() => {
        if (!hashtagsData) return []

        const maxScore = hashtagsData.recommended_tags.reduce(
            (maxValue, item) => Math.max(maxValue, item.relevance_score),
            0
        )

        return hashtagsData.recommended_tags.map((item) => ({
            ...item,
            size: maxScore > 0 ? 12 + (item.relevance_score / maxScore) * 18 : 14,
        }))
    }, [hashtagsData])

    const handleCopy = (value: string) => {
        void navigator.clipboard.writeText(value).then(() => {
            void message.success('Copied to clipboard')
        })
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
                <Row gutter={[12, 12]} align="bottom">
                    <Col flex={1}>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                            Topic
                        </Typography.Text>
                        <Input
                            placeholder="e.g. gaming"
                            value={inputTopic}
                            onChange={(event) => setInputTopic(event.target.value)}
                            onPressEnter={() => setTopic(inputTopic.trim() || undefined)}
                        />
                    </Col>
                    <Col>
                        <Button type="primary" loading={isLoading} onClick={() => setTopic(inputTopic.trim() || undefined)}>
                            Analyze Tags
                        </Button>
                    </Col>
                </Row>
            </Card>

            <YoutubeFiltersPanel
                title="Hashtag Filters"
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
                <EmptyState description="Search for a topic first to discover trending hashtags and tags." />
            )}

            {isLoading && (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Col xs={24} key={index}>
                            <Card loading style={{ height: 170 }} />
                        </Col>
                    ))}
                </Row>
            )}

            {error && <ErrorMessage error={error} onRetry={() => void refetch()} />}

            {hashtagsData && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Row gutter={[12, 12]}>
                        <Col>
                            <Card size="small">
                                <Typography.Text strong>{hashtagsData.summary.videos_analyzed}</Typography.Text>
                                <Typography.Text type="secondary"> videos analyzed</Typography.Text>
                            </Card>
                        </Col>
                        <Col>
                            <Card size="small">
                                <Typography.Text strong>{hashtagsData.summary.unique_tags_found}</Typography.Text>
                                <Typography.Text type="secondary"> unique tags</Typography.Text>
                            </Card>
                        </Col>
                        <Col>
                            <Card size="small">
                                <Typography.Text strong>{hashtagsData.summary.unique_hashtags_found}</Typography.Text>
                                <Typography.Text type="secondary"> unique hashtags</Typography.Text>
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col xs={24} lg={14}>
                            <Card title="Recommended Tag Cloud" style={{ height: '100%' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {tagCloudItems.map((item) => (
                                        <span
                                            key={item.tag}
                                            style={{
                                                fontSize: item.size,
                                                fontWeight: 600,
                                                lineHeight: 1.2,
                                                color: '#1677ff',
                                            }}
                                        >
                                            {item.tag}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        </Col>

                        <Col xs={24} lg={10}>
                            <Card
                                title="Trending Hashtags"
                                extra={
                                    <Button
                                        size="small"
                                        icon={<Copy size={12} />}
                                        onClick={() =>
                                            handleCopy(
                                                hashtagsData.recommended_tags
                                                    .map((item) => item.tag)
                                                    .join(', ')
                                            )
                                        }
                                    >
                                        Copy all top tags
                                    </Button>
                                }
                            >
                                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                    {hashtagsData.trending_hashtags.map((item) => (
                                        <div
                                            key={item.hashtag}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 12,
                                            }}
                                        >
                                            <Space direction="vertical" size={0}>
                                                <Typography.Text strong>{item.hashtag}</Typography.Text>
                                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                    {item.frequency} uses · {item.usage_percent.toFixed(1)}%
                                                </Typography.Text>
                                            </Space>
                                            <Button size="small" icon={<Copy size={12} />} onClick={() => handleCopy(item.hashtag)}>
                                                Copy
                                            </Button>
                                        </div>
                                    ))}
                                </Space>
                            </Card>
                        </Col>
                    </Row>

                    <Card title="Tag Combinations">
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            {hashtagsData.tag_combinations.map((combination, index) => (
                                <div key={index}>
                                    <Space wrap>
                                        {combination.tags.map((tagValue) => (
                                            <Tag key={tagValue} color="purple">
                                                {tagValue}
                                            </Tag>
                                        ))}
                                        <Tag>{combination.frequency}x</Tag>
                                    </Space>
                                </div>
                            ))}
                        </Space>
                    </Card>
                </Space>
            )}
        </Space>
    )
}
