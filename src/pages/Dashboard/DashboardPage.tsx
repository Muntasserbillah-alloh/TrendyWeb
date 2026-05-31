import { Card, Col, Empty, Row, Space, Spin, Typography } from 'antd'
import { DashboardProvider, useDashboardContext } from './partial/DashboardContext'
import { WidgetError } from './partial/DashboardShared'
import { resolveErrorMessage } from './partial/DashboardUtils'
import { RegionStickyHeader } from './partial/RegionStickyHeader'
import { TrendingNowWidget } from './partial/TrendingNowWidget'
import { TrendingTopicsWidget } from './partial/TrendingTopicsWidget'
import { TrendVelocityWidget } from './partial/TrendVelocityWidget'
import { CrossPlatformWidget } from './partial/CrossPlatformWidget'
import { SavedTrendsPlatformWidget } from './partial/SavedTrendsPlatformWidget'
import { SavedTrendsCategoryWidget } from './partial/SavedTrendsCategoryWidget'
import { OutlierVideosWidget } from './partial/OutlierVideosWidget'
import { CreatorRecommendationsWidget } from './partial/CreatorRecommendationsWidget'
import { RecentCollectionsWidget } from './partial/RecentCollectionsWidget'

function DashboardContent() {
    const { isRegionsLoading, regionsError, refetchRegions, regionCode } = useDashboardContext()

    if (isRegionsLoading) {
        return <Spin size="large" />
    }

    if (regionsError) {
        return (
            <Card>
                <WidgetError
                    message={resolveErrorMessage(regionsError, 'Could not load regions.')}
                    onRetry={refetchRegions}
                />
            </Card>
        )
    }

    if (!regionCode) {
        return (
            <Card>
                <Empty description="No regions available." />
            </Card>
        )
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <RegionStickyHeader />

            <Typography.Title level={5} style={{ margin: 0 }}>
                Live Signals
            </Typography.Title>

            <Row gutter={[16, 16]} style={{ marginInline: 0 }}>
                <Col xs={24} xl={12} style={{ minWidth: 0 }}>
                    <TrendingNowWidget />
                </Col>
                <Col xs={24} xl={12} style={{ minWidth: 0 }}>
                    <TrendingTopicsWidget />
                </Col>
            </Row>

            <Typography.Title level={5} style={{ margin: 0 }}>
                Momentum
            </Typography.Title>

            <TrendVelocityWidget />
            <CrossPlatformWidget />

            <Typography.Title level={5} style={{ margin: 0 }}>
                Saved Data Stats
            </Typography.Title>

            <Row gutter={[16, 16]} style={{ marginInline: 0 }}>
                <Col xs={24} lg={8} style={{ minWidth: 0 }}>
                    <SavedTrendsPlatformWidget />
                </Col>
                <Col xs={24} lg={8} style={{ minWidth: 0 }}>
                    <SavedTrendsCategoryWidget />
                </Col>
                <Col xs={24} lg={8} style={{ minWidth: 0 }}>
                    <OutlierVideosWidget />
                </Col>
            </Row>

            <Typography.Title level={5} style={{ margin: 0 }}>
                Ideas and Recommendations
            </Typography.Title>

            <CreatorRecommendationsWidget />

            <Typography.Title level={5} style={{ margin: 0 }}>
                My Collections
            </Typography.Title>

            <RecentCollectionsWidget />
        </Space>
    )
}

export function DashboardPage() {
    return (
        <DashboardProvider>
            <DashboardContent />
        </DashboardProvider>
    )
}
