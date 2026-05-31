import { useState } from 'react'
import { Card, Col, Row, Select, Slider, Space, Tag, Typography } from 'antd'
import { useRegions } from '../../hooks/useRegions'
import { useCalendar } from '../../hooks/usePlanner'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'

export function CalendarTab() {
    const [regionCode, setRegionCode] = useState<string | undefined>()
    const [daysAhead, setDaysAhead] = useState(14)
    const { data: regionsData } = useRegions()
    const { data, isLoading, error } = useCalendar(regionCode, daysAhead)

    const calendarDays = data?.data ?? []

    const getDayOfWeek = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
    }

    const getDateDisplay = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card>
                <Row gutter={[12, 12]} align="middle">
                    <Col>
                        <Select
                            placeholder="Select region"
                            style={{ width: 200 }}
                            value={regionCode}
                            onChange={setRegionCode}
                            options={(regionsData?.data ?? []).map((r) => ({ value: r.code, label: r.name }))}
                        />
                    </Col>
                    <Col flex="1" style={{ maxWidth: 300 }}>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Days Ahead: {daysAhead}
                        </Typography.Text>
                        <Slider
                            min={7}
                            max={30}
                            value={daysAhead}
                            onChange={setDaysAhead}
                        />
                    </Col>
                </Row>
            </Card>

            {!regionCode && (
                <Card>
                    <Typography.Text type="secondary">Select a region to view the content calendar</Typography.Text>
                </Card>
            )}

            {isLoading && <Spinner tip="Loading calendar..." />}
            {error && <ErrorMessage error={error} />}

            {calendarDays.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {(calendarDays ?? []).map((day, i) => (
                        <Card
                            key={i}
                            size="small"
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography.Text strong>{getDateDisplay(day.date)}</Typography.Text>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>{getDayOfWeek(day.date)}</Typography.Text>
                                </div>
                            }
                        >
                            {day.recommended_categories.length > 0 && (
                                <div style={{ marginBottom: 8 }}>
                                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>Categories:</Typography.Text>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                        {(day.recommended_categories ?? []).map((cat, j) => (
                                            <Tag key={j} color="blue" style={{ fontSize: 11 }}>{cat}</Tag>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {day.hot_topics.length > 0 && (
                                <div>
                                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>Hot Topics:</Typography.Text>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                        {(day.hot_topics ?? []).map((topic, j) => (
                                            <Tag key={j} color="volcano" style={{ fontSize: 11 }}>{topic}</Tag>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </Space>
    )
}
