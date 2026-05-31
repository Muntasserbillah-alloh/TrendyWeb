import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Col, Empty, Row, Space, Typography } from 'antd'
import { getCreatorRecommendations } from '../../../api/trends'
import { formatNumber } from '../../../utils'
import type { CreatorRecommendation } from '../../../types'
import { useDashboardContext } from './DashboardContext'
import { TrendPlatformPill, WidgetError, WidgetHeader, WidgetLoading } from './DashboardShared'
import { DASHBOARD_QUERY_STALE_TIME, resolveErrorMessage } from './DashboardUtils'

export function CreatorRecommendationsWidget() {
    const { regionCode } = useDashboardContext()
    const navigate = useNavigate()

    const query = useQuery<CreatorRecommendation[]>({
        queryKey: ['dashboard', 'creator-recommendations', regionCode],
        queryFn: async () => (await getCreatorRecommendations(regionCode!, { limit: 6 })).data,
        enabled: !!regionCode,
        staleTime: DASHBOARD_QUERY_STALE_TIME,
    })

    const recommendations = query.data ?? []

    return (
        <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <WidgetHeader
                    title="Creator Recommendations"
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
                            'Could not load creator recommendations.'
                        )}
                        onRetry={() => {
                            void query.refetch()
                        }}
                    />
                )}

                {!query.isLoading && !query.error && recommendations.length === 0 && (
                    <Empty description="No recommendations available." />
                )}

                {!query.isLoading && !query.error && recommendations.length > 0 && (
                    <>
                        <Row gutter={[12, 12]} style={{ marginInline: 0 }}>
                            {recommendations.map((recommendation, index) => (
                                <Col
                                    key={`${recommendation.title}-${index}`}
                                    xs={24}
                                    sm={12}
                                    xl={8}
                                    style={{ minWidth: 0 }}
                                >
                                    <Card size="small" style={{ height: '100%' }}>
                                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                            <Typography.Text
                                                strong
                                                style={{
                                                    display: 'block',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                title={`#${index + 1} ${recommendation.title}`}
                                            >
                                                #{index + 1} {recommendation.title}
                                            </Typography.Text>

                                            <Typography.Text type="secondary">
                                                Score: {recommendation.creator_score}/100
                                            </Typography.Text>

                                            <Typography.Text type="secondary">
                                                Volume: {formatNumber(recommendation.volume)}
                                            </Typography.Text>

                                            <Space size={[6, 6]} wrap>
                                                {recommendation.platforms?.map((platform) => (
                                                    <TrendPlatformPill
                                                        key={`${recommendation.title}-${platform}`}
                                                        platform={platform}
                                                    />
                                                ))}
                                            </Space>

                                            <Button
                                                size="small"
                                                onClick={() =>
                                                    navigate(
                                                        `/planner/explore?topic=${encodeURIComponent(
                                                            recommendation.title
                                                        )}&region_code=${encodeURIComponent(regionCode!)}`
                                                    )
                                                }
                                            >
                                                Explore
                                            </Button>
                                        </Space>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Button
                            type="link"
                            onClick={() => navigate('/creator')}
                            style={{ paddingInline: 0 }}
                        >
                            See all recommendations
                        </Button>
                    </>
                )}
            </Space>
        </Card>
    )
}
