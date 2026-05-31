import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Empty, Space, Typography } from 'antd'
import { getCrossPlatform } from '../../../api/trends'
import { formatNumber } from '../../../utils'
import type { CrossPlatformItem } from '../../../types'
import { useDashboardContext } from './DashboardContext'
import { TrendPlatformPill, WidgetError, WidgetHeader, WidgetLoading } from './DashboardShared'
import { DASHBOARD_QUERY_STALE_TIME, resolveErrorMessage } from './DashboardUtils'

function sortCrossPlatformSignals(items: CrossPlatformItem[]): CrossPlatformItem[] {
    return [...items].sort((left, right) => {
        if (right.platform_count !== left.platform_count) {
            return right.platform_count - left.platform_count
        }
        return right.total_volume - left.total_volume
    })
}

export function CrossPlatformWidget() {
    const { regionCode } = useDashboardContext()

    const query = useQuery<CrossPlatformItem[]>({
        queryKey: ['dashboard', 'cross-platform', regionCode],
        queryFn: async () => (await getCrossPlatform(regionCode!, 2)).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const topics = useMemo(
        () => sortCrossPlatformSignals(query.data ?? []).slice(0, 8),
        [query.data]
    )

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <WidgetHeader
                    title="Cross-Platform Signals"
                    badgeLabel="All Platforms"
                    badgeVariant="all"
                    onRefresh={() => {
                        void query.refetch()
                    }}
                />

                {query.isLoading && <WidgetLoading rows={6} />}

                {query.error && (
                    <WidgetError
                        message={resolveErrorMessage(
                            query.error,
                            'Could not load cross-platform signals.'
                        )}
                        onRetry={() => {
                            void query.refetch()
                        }}
                    />
                )}

                {!query.isLoading && !query.error && topics.length === 0 && (
                    <Empty description="No cross-platform signals available." />
                )}

                {!query.isLoading && !query.error && topics.length > 0 && (
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {topics.map((item) => (
                            <div
                                key={`${item.title}-${item.platform_count}`}
                                style={{
                                    border: '1px solid #f0f0f0',
                                    borderRadius: 10,
                                    padding: '10px 12px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 8,
                                        minWidth: 0,
                                        width: '100%',
                                    }}
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
                                            strong
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
                                        <Typography.Text style={{ flexShrink: 0 }} type="secondary">
                                            {formatNumber(item.total_volume)}
                                        </Typography.Text>
                                    </div>

                                    <Space size={[6, 6]} wrap>
                                        {item.platforms.map((platform) => (
                                            <TrendPlatformPill
                                                key={`${item.title}-${platform}`}
                                                platform={platform}
                                            />
                                        ))}
                                    </Space>
                                </div>
                            </div>
                        ))}
                    </Space>
                )}
            </Space>
        </Card>
    )
}
