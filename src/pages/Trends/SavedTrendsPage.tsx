import { useMemo, useState } from 'react'
import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd'
import { ExternalLink } from 'lucide-react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { EmptyState } from '../../components/EmptyState'
import { ErrorMessage } from '../../components/ErrorMessage'
import { Pagination } from '../../components/Pagination'
import { PlatformBadge } from '../../components/PlatformBadge'
import { TopRequestLoader } from '../../components/TopRequestLoader'
import { useCategories } from '../../hooks/useCategories'
import { useRegions } from '../../hooks/useRegions'
import { useTrends } from '../../hooks/useTrends'
import { formatDate, formatNumber } from '../../utils'
import type { Trend, TrendFilters } from '../../types'

const { RangePicker } = DatePicker

const PLATFORM_OPTIONS = [
    { label: 'All Platforms', value: '' },
    { label: 'YouTube', value: 'youtube' },
    { label: 'Google Trends', value: 'google_trends' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'Twitter', value: 'twitter' },
]

export function SavedTrendsPage() {
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<TrendFilters>({})

    const { data: regionsData } = useRegions()
    const { data: categoriesData } = useCategories()
    const { data, isLoading, isFetching, error } = useTrends({ ...filters, page, per_page: 20 })

    const regions = regionsData?.data ?? []
    const categories = categoriesData?.data ?? []
    const trends = data?.data ?? []
    const meta = data?.meta

    const tableLoading = isLoading || isFetching

    const setListFilter = (key: keyof TrendFilters, value: unknown) => {
        setPage(1)
        setFilters((prev) => ({ ...prev, [key]: value || undefined }))
    }

    const dateRangeValue = useMemo(() => {
        if (!filters.date_from || !filters.date_to) return null
        return [dayjs(filters.date_from), dayjs(filters.date_to)] as [dayjs.Dayjs, dayjs.Dayjs]
    }, [filters.date_from, filters.date_to])

    const savedTrendsColumns: ColumnsType<Trend> = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            render: (title: string, record) =>
                record.url ? (
                    <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                        {title}
                        <ExternalLink size={12} style={{ color: '#8c8c8c', flexShrink: 0 }} />
                    </a>
                ) : (
                    title
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
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 150,
            render: (category: Trend['category']) =>
                category?.name ?? <Typography.Text type="secondary">-</Typography.Text>,
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
            title: 'Date',
            dataIndex: 'trend_date',
            key: 'trend_date',
            width: 150,
            render: (dateValue: string) => formatDate(dateValue),
        },
        {
            title: 'Region',
            dataIndex: 'region',
            key: 'region',
            width: 100,
            render: (region: Trend['region']) => <Tag>{region.code}</Tag>,
        },
    ]

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <TopRequestLoader loading={isFetching} />

            <div>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    Saved Trend Library
                </Typography.Title>
                <Typography.Text type="secondary">
                    Search and filter your approved trends by platform, region, category, date, and volume.
                </Typography.Text>
            </div>

            <Card title="Filter Saved Trends">
                <Row gutter={[12, 12]} align="middle">
                    <Col>
                        <Select
                            value={filters.platform ?? ''}
                            options={PLATFORM_OPTIONS}
                            style={{ width: 170 }}
                            onChange={(value) => setListFilter('platform', value)}
                        />
                    </Col>

                    <Col>
                        <Select
                            placeholder="Region"
                            allowClear
                            value={filters.region_code}
                            style={{ width: 160 }}
                            options={regions.map((region) => ({ value: region.code, label: region.name }))}
                            onChange={(value) => setListFilter('region_code', value)}
                        />
                    </Col>

                    <Col>
                        <Select
                            placeholder="Category"
                            allowClear
                            value={filters.category_id}
                            style={{ width: 160 }}
                            options={categories.map((category) => ({ value: category.id, label: category.name }))}
                            onChange={(value) => setListFilter('category_id', value as number)}
                        />
                    </Col>

                    <Col>
                        <RangePicker
                            value={dateRangeValue}
                            onChange={(dates) => {
                                if (dates?.[0] && dates?.[1]) {
                                    setListFilter('date_from', dates[0].format('YYYY-MM-DD'))
                                    setListFilter('date_to', dates[1].format('YYYY-MM-DD'))
                                    return
                                }

                                setFilters((prev) => {
                                    const next = { ...prev }
                                    delete next.date_from
                                    delete next.date_to
                                    return next
                                })
                            }}
                        />
                    </Col>

                    <Col>
                        <Input.Search
                            placeholder="Search saved trends"
                            allowClear
                            style={{ width: 220 }}
                            onSearch={(value) => setListFilter('topic', value)}
                        />
                    </Col>

                    <Col>
                        <InputNumber
                            min={0}
                            placeholder="Min volume"
                            value={filters.min_volume}
                            onChange={(value) => setListFilter('min_volume', value ?? undefined)}
                        />
                    </Col>

                    <Col>
                        <Button
                            onClick={() => {
                                setFilters({})
                                setPage(1)
                            }}
                        >
                            Reset
                        </Button>
                    </Col>
                </Row>
            </Card>

            <Card title="Saved Trends">
                {error && <ErrorMessage error={error} />}

                {!tableLoading && trends.length === 0 ? (
                    <EmptyState description="No saved trends match your filters. Save trends from Trend Discovery to build this library." />
                ) : (
                    <>
                        <Table
                            dataSource={trends}
                            columns={savedTrendsColumns}
                            rowKey="id"
                            loading={tableLoading}
                            pagination={false}
                            scroll={{ x: 900 }}
                        />
                        {meta && <Pagination page={meta.page} perPage={meta.per_page} total={meta.total} onChange={setPage} />}
                    </>
                )}
            </Card>
        </Space>
    )
}
