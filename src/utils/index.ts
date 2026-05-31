export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}

export const TREND_SAVE_QUEUE_STORAGE_KEY = 'trendy:planner-explore-save-queue'

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function platformColor(platform: string): string {
  switch (platform) {
    case 'youtube':
      return 'red'
    case 'google_trends':
      return 'blue'
    case 'tiktok':
      return 'default'
    case 'twitter':
      return 'cyan'
    default:
      return 'default'
  }
}

export function platformLabel(platform: string): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube'
    case 'google_trends':
      return 'Google Trends'
    case 'tiktok':
      return 'TikTok'
    case 'twitter':
      return 'Twitter'
    default:
      return platform
  }
}

export function outlierScoreColor(score: number | null): 'green' | 'orange' | 'red' | 'default' {
  if (score == null) return 'default'
  if (score >= 10) return 'red'
  if (score >= 5) return 'orange'
  if (score >= 2) return 'green'
  return 'default'
}

export function outlierScoreLabel(score: number | null): string {
  if (score == null) return 'N/A'
  const label = `${score.toFixed(1)}x`
  return score >= 10 ? `🔥 ${label}` : label
}

export function competitionLevelColor(level: string): string {
  switch (level) {
    case 'low':
      return 'green'
    case 'moderate':
      return 'gold'
    case 'high':
      return 'orange'
    case 'very_high':
      return 'red'
    default:
      return 'default'
  }
}

export function formatHour(hour: number): string {
  const normalizedHour = hour % 24
  const suffix = normalizedHour >= 12 ? 'PM' : 'AM'
  const twelveHour = normalizedHour % 12 || 12
  return `${twelveHour}:00 ${suffix}`
}

export function opportunityScoreColor(score: number): string {
  if (score >= 60) return '#22c55e'
  if (score >= 30) return '#f59e0b'
  return '#ef4444'
}

export function toCommaSeparated(values?: Array<string | number> | null): string | undefined {
  if (!values || values.length === 0) return undefined
  return values
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(',')
}

export function fromCommaSeparated(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function compactQueryParams(
  params: Record<string, string | number | undefined | null>
): Record<string, string | number> {
  const compact: Record<string, string | number> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    compact[key] = value
  })
  return compact
}

export function normalizeDateForApi(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10)
  const parsedDate = new Date(dateStr)
  if (Number.isNaN(parsedDate.getTime())) return new Date().toISOString().slice(0, 10)
  return parsedDate.toISOString().slice(0, 10)
}

export function buildTrendIdentityKey(item: {
  title: string
  platform: string
  trend_date?: string | null
  url?: string | null
}): string {
  const normalizedTitle = item.title.trim().toLowerCase()
  const normalizedDate = item.trend_date ? normalizeDateForApi(item.trend_date) : 'unknown-date'
  const normalizedUrl = (item.url ?? '').trim().toLowerCase()
  return `${item.platform}::${normalizedTitle}::${normalizedDate}::${normalizedUrl}`
}

export function buildTrendSelectionKey(
  item: { title: string; platform: string; trend_date?: string | null; url?: string | null },
  index: number = 0
): string {
  return `${buildTrendIdentityKey(item)}::${index}`
}
