import type { CSSProperties } from 'react'
import { Button, Skeleton, Space, Typography } from 'antd'
import { platformLabel } from '../../../utils'
import type { Trend } from '../../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashboardBadgeVariant = 'youtube' | 'tiktok' | 'google' | 'multi' | 'all' | 'saved'

// ─── Private style maps ───────────────────────────────────────────────────────

const DASHBOARD_BADGE_STYLE: Record<DashboardBadgeVariant, CSSProperties> = {
    youtube: { background: '#FF0000', color: '#fff' },
    tiktok: { background: '#111111', color: '#fff' },
    google: { background: '#4285F4', color: '#fff' },
    multi: { background: '#7C3AED', color: '#fff' },
    all: { background: '#4338CA', color: '#fff' },
    saved: { background: '#0D9488', color: '#fff' },
}

const TREND_PLATFORM_STYLE: Record<Trend['platform'], CSSProperties> = {
    youtube: { background: '#FF0000', color: '#fff' },
    tiktok: { background: '#111111', color: '#fff' },
    google_trends: { background: '#4285F4', color: '#fff' },
    twitter: { background: '#0EA5E9', color: '#fff' },
}

// ─── Shared primitive components ──────────────────────────────────────────────

export function DashboardBadge({ label, variant }: { label: string; variant: DashboardBadgeVariant }) {
    return (
        <span
            style={{
                ...DASHBOARD_BADGE_STYLE[variant],
                alignItems: 'center',
                borderRadius: 999,
                display: 'inline-flex',
                fontSize: 12,
                fontWeight: 600,
                justifyContent: 'center',
                lineHeight: 1,
                padding: '6px 10px',
            }}
        >
            {label}
        </span>
    )
}

export function TrendPlatformPill({ platform }: { platform: Trend['platform'] }) {
    return (
        <span
            style={{
                ...TREND_PLATFORM_STYLE[platform],
                alignItems: 'center',
                borderRadius: 999,
                display: 'inline-flex',
                fontSize: 11,
                fontWeight: 600,
                justifyContent: 'center',
                lineHeight: 1,
                padding: '4px 8px',
            }}
        >
            {platformLabel(platform)}
        </span>
    )
}

export function WidgetHeader({
    title,
    badgeLabel,
    badgeVariant,
    onRefresh,
}: {
    title: string
    badgeLabel: string
    badgeVariant: DashboardBadgeVariant
    onRefresh: () => void
}) {
    return (
        <div
            style={{
                alignItems: 'flex-start',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'space-between',
                minWidth: 0,
                width: '100%',
            }}
        >
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <Typography.Title
                    level={5}
                    style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={title}
                >
                    {title}
                </Typography.Title>
                <DashboardBadge label={badgeLabel} variant={badgeVariant} />
            </div>
            <Button size="small" onClick={onRefresh} style={{ flexShrink: 0 }}>
                Refresh
            </Button>
        </div>
    )
}

export function WidgetLoading({ rows = 5 }: { rows?: number }) {
    return <Skeleton active title={false} paragraph={{ rows, width: '100%' }} />
}

export function WidgetError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <Space direction="vertical" size={8}>
            <Typography.Text type="secondary">{message}</Typography.Text>
            <Button onClick={onRetry}>Retry</Button>
        </Space>
    )
}
