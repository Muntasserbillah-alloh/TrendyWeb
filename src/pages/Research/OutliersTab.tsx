import { useState } from 'react'
import { Button, Card, Col, Input, Row, Slider, Space, Typography } from 'antd'
import { useOutliers } from '../../hooks/useYoutube'
import { useYoutubeGlobalFilters } from '../../hooks/useYoutubeGlobalFilters'
import { VideoCard } from '../../components/VideoCard'
import { ErrorMessage } from '../../components/ErrorMessage'
import { EmptyState } from '../../components/EmptyState'
import { Pagination } from '../../components/Pagination'
import { YoutubeFiltersPanel } from '../../components/youtube/YoutubeFiltersPanel'

interface SubmittedOutlierFilters {
    topic?: string
    region_code?: string
    min_score: number
    date_from?: string
    date_to?: string
}

export function OutliersTab() {
    const [page, setPage] = useState(1)
    const [topic, setTopic] = useState('')
    const [minScore, setMinScore] = useState(2)
    const [hasSearched, setHasSearched] = useState(false)
    const [submittedFilters, setSubmittedFilters] = useState<SubmittedOutlierFilters>({
        min_score: 2,
    })

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

    const { data, isLoading, error, refetch, isFetching } = useOutliers(
        {
            topic: submittedFilters.topic,
            region_code: submittedFilters.region_code,
            min_score: submittedFilters.min_score,
            date_from: submittedFilters.date_from,
            date_to: submittedFilters.date_to,
            page,
            per_page: 12,
        },
        { enabled: hasSearched }
    )

    const videos = data?.data ?? []
    const meta = data?.meta

    const handleSearch = () => {
        setPage(1)
        setSubmittedFilters({
            topic: topic.trim() || undefined,
            region_code: regionCode,
            min_score: minScore,
            date_from: dateFrom,
            date_to: dateTo,
        })
        setHasSearched(true)
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <YoutubeFiltersPanel
                title="Outlier Filters"
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
                        <Col xs={24} md={12}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                                Topic
                            </Typography.Text>
                            <Input
                                placeholder="Filter by topic"
                                value={topic}
                                onChange={(event) => setTopic(event.target.value)}
                                onPressEnter={handleSearch}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} md={12}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                                Min outlier score: {minScore.toFixed(1)}x
                            </Typography.Text>
                            <Slider
                                min={2}
                                max={20}
                                step={0.5}
                                value={minScore}
                                onChange={(value) => setMinScore(Array.isArray(value) ? value[0] : value)}
                            />
                        </Col>
                    </Row>
                }
            />

            <Row justify="end">
                <Button
                    type="primary"
                    onClick={handleSearch}
                    loading={hasSearched && isFetching}
                >
                    Search
                </Button>
            </Row>

            {!hasSearched && (
                <EmptyState description="Set your filters and click Search to load outlier videos." />
            )}

            {hasSearched && isLoading && (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Col key={index} xs={24} sm={12} lg={8}>
                            <Card loading style={{ height: 280 }} />
                        </Col>
                    ))}
                </Row>
            )}
            {hasSearched && error && <ErrorMessage error={error} onRetry={() => void refetch()} />}
            {hasSearched && !isLoading && !error && videos.length === 0 && (
                <EmptyState description="No outlier videos found" />
            )}

            {hasSearched && videos.length > 0 && (
                <>
                    {isFetching && (
                        <Typography.Text type="secondary">
                            Refreshing outlier list...
                        </Typography.Text>
                    )}
                    <Row gutter={[16, 16]}>
                        {videos.map((v, index) => (
                            <Col key={`${v.video_id}-${index}`} xs={24} sm={12} lg={8} xl={6}>
                                <VideoCard video={v} />
                            </Col>
                        ))}
                    </Row>
                    {meta && <Pagination page={meta.page} perPage={meta.per_page} total={meta.total} onChange={setPage} />}
                </>
            )}
        </Space>
    )
}
