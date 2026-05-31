import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
    Button,
    Card,
    Col,
    Drawer,
    Grid,
    Input,
    Row,
    Segmented,
    Select,
    Space,
    Typography,
} from 'antd'
import { Filter } from 'lucide-react'
import {
    YOUTUBE_DATE_PRESET_OPTIONS,
    type YoutubeDatePreset,
} from '../../hooks/useYoutubeGlobalFilters'
import { useRegions } from '../../hooks/useRegions'

interface YoutubeFiltersPanelProps {
    regionCode?: string
    onRegionChange?: (value: string | undefined) => void
    dateFrom: string
    dateTo: string
    preset: YoutubeDatePreset
    onPresetChange: (preset: YoutubeDatePreset) => void
    onDateFromChange: (value: string) => void
    onDateToChange: (value: string) => void
    extra?: ReactNode
    showRegion?: boolean
    showDateRange?: boolean
    title?: string
}

export function YoutubeFiltersPanel({
    regionCode,
    onRegionChange,
    dateFrom,
    dateTo,
    preset,
    onPresetChange,
    onDateFromChange,
    onDateToChange,
    extra,
    showRegion = true,
    showDateRange = true,
    title = 'Filters',
}: YoutubeFiltersPanelProps) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const screens = Grid.useBreakpoint()
    const isMobile = !screens.md
    const { data: regionsData, isLoading: isRegionsLoading } = useRegions()

    const regionOptions = useMemo(
        () =>
            (regionsData?.data ?? []).map((region) => ({
                value: region.code,
                label: region.name,
            })),
        [regionsData?.data]
    )

    useEffect(() => {
        if (!showRegion || !onRegionChange || regionOptions.length === 0) return

        const isCurrentRegionValid = !!regionCode && regionOptions.some((option) => option.value === regionCode)
        if (isCurrentRegionValid) return

        onRegionChange(regionOptions[0].value)
    }, [showRegion, onRegionChange, regionOptions, regionCode])

    const filterContent = (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {showDateRange && (
                <>
                    <div>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                            Date range preset
                        </Typography.Text>
                        <Segmented
                            block
                            value={preset}
                            options={YOUTUBE_DATE_PRESET_OPTIONS.map((option) => ({
                                value: option.value,
                                label: option.label,
                            }))}
                            onChange={(value) => onPresetChange(value as YoutubeDatePreset)}
                        />
                    </div>

                    <Row gutter={[12, 12]}>
                        <Col xs={24} sm={12}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                                Date from
                            </Typography.Text>
                            <Input
                                type="date"
                                value={dateFrom}
                                max={dateTo}
                                onChange={(event) => onDateFromChange(event.target.value)}
                            />
                        </Col>
                        <Col xs={24} sm={12}>
                            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                                Date to
                            </Typography.Text>
                            <Input
                                type="date"
                                value={dateTo}
                                min={dateFrom}
                                onChange={(event) => onDateToChange(event.target.value)}
                            />
                        </Col>
                    </Row>
                </>
            )}

            {showRegion && onRegionChange && (
                <div>
                    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
                        Region
                    </Typography.Text>
                    <Select
                        value={regionCode}
                        onChange={(value) => onRegionChange(value)}
                        loading={isRegionsLoading}
                        style={{ width: '100%' }}
                        options={regionOptions}
                        placeholder="Select region"
                    />
                </div>
            )}

            {extra}
        </Space>
    )

    if (isMobile) {
        return (
            <>
                <Button icon={<Filter size={16} />} onClick={() => setDrawerOpen(true)}>
                    {title}
                </Button>
                <Drawer
                    title={title}
                    placement="bottom"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    height="70%"
                >
                    {filterContent}
                </Drawer>
            </>
        )
    }

    return (
        <Card>
            <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
                {title}
            </Typography.Text>
            {filterContent}
        </Card>
    )
}
