import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Empty, Space, Typography } from 'antd'
import { getTrendsGrouped } from '../../../api/trends'
import type { TrendsGroupedItem } from '../../../types'
import { useDashboardContext } from './DashboardContext'
import { WidgetError, WidgetHeader, WidgetLoading } from './DashboardShared'
import { DASHBOARD_QUERY_STALE_TIME, groupedLabel, resolveErrorMessage } from './DashboardUtils'

export function SavedTrendsCategoryWidget() {
    const { regionCode } = useDashboardContext()
    const navigate = useNavigate()

    const query = useQuery<TrendsGroupedItem[]>({
        queryKey: ['dashboard', 'grouped-category', regionCode],
        queryFn: async () => (await getTrendsGrouped(regionCode!, 'category')).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const groupedCategory = query.data ?? []
    const maxCount =
        groupedCategory.length > 0
            ? Math.max(...groupedCategory.map((item) => item.count))
            : 1

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <WidgetHeader
                    title="Saved Trends by Category"
                    badgeLabel="Saved Trends"
                    badgeVariant="saved"
                    onRefresh={() => {
                        void query.refetch()
                    }}
                />

                {query.isLoading && <WidgetLoading rows={5} />}

                {query.error && (
                    <WidgetError
                        message={resolveErrorMessage(query.error, 'Could not load category grouping.')}
                        onRetry={() => {
                            void query.refetch()
                        }}
                    />
                )}

                {!query.isLoading && !query.error && groupedCategory.length === 0 && (
                    <Empty description="No saved trends yet." />
                )}

                {!query.isLoading && !query.error && groupedCategory.length > 0 && (
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        {groupedCategory.map((item, index) => (
                            <Space
                                key={`${groupedLabel(item, 'category')}-${index}`}
                                direction="vertical"
                                size={4}
                                style={{ width: '100%' }}
                            >
                                <div
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
                                        title={groupedLabel(item, 'category')}
                                    >
                                        {groupedLabel(item, 'category')}
                                    </Typography.Text>
                                    <Typography.Text style={{ flexShrink: 0 }}>
                                        {item.count}
                                    </Typography.Text>
                                </div>

                                <div
                                    style={{
                                        background: '#e5e7eb',
                                        borderRadius: 999,
                                        height: 8,
                                        overflow: 'hidden',
                                        width: '100%',
                                    }}
                                >
                                    <div
                                        style={{
                                            background: '#0D9488',
                                            borderRadius: 999,
                                            height: '100%',
                                            width: `${Math.max((item.count / maxCount) * 100, 2)}%`,
                                        }}
                                    />
                                </div>
                            </Space>
                        ))}

                        <Button
                            type="link"
                            onClick={() => navigate('/trends/saved')}
                            style={{ paddingInline: 0 }}
                        >
                            Browse all trends
                        </Button>
                    </Space>
                )}
            </Space>
        </Card>
    )
}
