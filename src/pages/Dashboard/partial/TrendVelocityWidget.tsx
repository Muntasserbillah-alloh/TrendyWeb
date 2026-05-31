import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Col, Row, Space, Tag, Typography } from 'antd'
import { getVelocity } from '../../../api/trends'
import type { VelocityItem } from '../../../types'
import { useDashboardContext } from './DashboardContext'
import { WidgetError, WidgetHeader, WidgetLoading } from './DashboardShared'
import { DASHBOARD_QUERY_STALE_TIME, resolveErrorMessage } from './DashboardUtils'

export function TrendVelocityWidget() {
    const { regionCode } = useDashboardContext()

    const query = useQuery<VelocityItem[]>({
        queryKey: ['dashboard', 'velocity', regionCode],
        queryFn: async () => (await getVelocity(regionCode!, 7)).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const risingTopics = useMemo(
        () =>
            (query.data ?? [])
                .filter((item) => item.status === 'new' || item.status === 'rising')
                .sort((left, right) => right.velocity - left.velocity)
                .slice(0, 5),
        [query.data]
    )

    const decliningTopics = useMemo(
        () =>
            (query.data ?? [])
                .filter((item) => item.status === 'falling')
                .sort((left, right) => left.velocity - right.velocity)
                .slice(0, 5),
        [query.data]
    )

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <WidgetHeader
                    title="Trend Velocity"
                    badgeLabel="All Platforms"
                    badgeVariant="all"
                    onRefresh={() => {
                        void query.refetch()
                    }}
                />

                {query.isLoading && <WidgetLoading rows={7} />}

                {query.error && (
                    <WidgetError
                        message={resolveErrorMessage(query.error, 'Could not load trend velocity.')}
                        onRetry={() => {
                            void query.refetch()
                        }}
                    />
                )}

                {!query.isLoading && !query.error && (
                    <Row gutter={[16, 16]} style={{ marginInline: 0 }}>
                        <Col xs={24} md={12} style={{ minWidth: 0 }}>
                            <Card size="small" title="Rising">
                                {risingTopics.length === 0 ? (
                                    <Typography.Text type="secondary">
                                        No rising topics in this window.
                                    </Typography.Text>
                                ) : (
                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                        {risingTopics.map((item) => (
                                            <div
                                                key={`rising-${item.title}`}
                                                style={{
                                                    alignItems: 'center',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    minWidth: 0,
                                                    width: '100%',
                                                }}
                                            >
                                                <Typography.Text
                                                    style={{
                                                        flex: 1,
                                                        marginInlineEnd: 8,
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </Typography.Text>
                                                <Tag color="green" style={{ flexShrink: 0, marginInlineEnd: 0 }}>
                                                    +{Math.abs(item.velocity).toFixed(1)}%
                                                </Tag>
                                            </div>
                                        ))}
                                    </Space>
                                )}
                            </Card>
                        </Col>

                        <Col xs={24} md={12} style={{ minWidth: 0 }}>
                            <Card size="small" title="Declining">
                                {decliningTopics.length === 0 ? (
                                    <Typography.Text type="secondary">
                                        No declining topics in this window.
                                    </Typography.Text>
                                ) : (
                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                        {decliningTopics.map((item) => (
                                            <div
                                                key={`declining-${item.title}`}
                                                style={{
                                                    alignItems: 'center',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    minWidth: 0,
                                                    width: '100%',
                                                }}
                                            >
                                                <Typography.Text
                                                    style={{
                                                        flex: 1,
                                                        marginInlineEnd: 8,
                                                        minWidth: 0,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </Typography.Text>
                                                <Tag color="red" style={{ flexShrink: 0, marginInlineEnd: 0 }}>
                                                    -{Math.abs(item.velocity).toFixed(1)}%
                                                </Tag>
                                            </div>
                                        ))}
                                    </Space>
                                )}
                            </Card>
                        </Col>
                    </Row>
                )}
            </Space>
        </Card>
    )
}
