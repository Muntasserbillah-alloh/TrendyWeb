import type { YoutubeCollectionSummary, TrendsGroupedItem } from '../../../types'
import { platformLabel } from '../../../utils'

// ─── Constants ────────────────────────────────────────────────────────────────

export const DASHBOARD_QUERY_STALE_TIME = 5 * 60 * 1000

// ─── Pure helper functions ────────────────────────────────────────────────────

export function resolveErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message
    }
    return fallback
}

export function outlierTagColor(score: number | null): 'green' | 'orange' | 'red' | 'default' {
    if (score == null) return 'default'
    if (score >= 10) return 'red'
    if (score >= 5) return 'orange'
    if (score >= 2) return 'green'
    return 'default'
}

export function formatOutlierScore(score: number | null): string {
    if (score == null) return 'N/A'
    if (score >= 10) return `🔥 ${score.toFixed(1)}x`
    return `${score.toFixed(1)}x`
}

export function videoTypeTag(
    videoType: string | undefined
): { color: 'blue' | 'default'; label: string } | null {
    if (videoType === 'shorts') return { color: 'blue', label: 'SHORT' }
    if (videoType === 'normal') return { color: 'default', label: 'NORMAL' }
    return null
}

export function collectionSourceTagColor(
    source: YoutubeCollectionSummary['source']
): 'default' | 'orange' {
    return source === 'trending' ? 'orange' : 'default'
}

export function buildCollectionAddPath(collection: YoutubeCollectionSummary): string {
    const basePath =
        collection.source === 'trending' ? '/youtube/trending-videos' : '/youtube/search'
    return `${basePath}?append_collection_id=${collection.id}`
}

export function groupedLabel(
    item: TrendsGroupedItem,
    groupBy: 'platform' | 'category'
): string {
    if (groupBy === 'platform') {
        return item.platform ? platformLabel(item.platform) : 'Unknown platform'
    }
    return item.category || 'Uncategorized'
}

export function groupedTotal(items: TrendsGroupedItem[]): number {
    return items.reduce((acc, item) => acc + item.count, 0)
}
