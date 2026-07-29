import type { PacingStatus, VideoAnalyticsSignals } from '../../../types'

export interface AdvancedAnalyticsOptions {
  bucket_size_sec: number
  languages: string
  max_comment_pages: number
}

export const DEFAULT_ADVANCED: AdvancedAnalyticsOptions = {
  bucket_size_sec: 10,
  languages: 'en,ar',
  max_comment_pages: 5,
}

export function parseVideoId(input: string): string | null {
  const m = input.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{8,15})/)
  if (m) return m[1]
  return /^[A-Za-z0-9_-]{8,15}$/.test(input.trim()) ? input.trim() : null
}

export function formatTs(sec: number): string {
  const s = Math.max(0, Math.round(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export function parseTimestampToSec(ts: string | null): number | null {
  if (!ts) return null
  const parts = ts.split(':').map((p) => parseInt(p, 10))
  if (parts.some((n) => Number.isNaN(n))) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

export function formatDurationHuman(sec: number | null | undefined): string {
  if (sec == null) return '—'
  const s = Math.round(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h) return `${h}h ${m}m`
  return `${m}m ${r}s`
}

export function pct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${Math.round(v * 100)}%`
}

export function siteCommentUrl(videoId: string, sec: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.round(sec)}s`
}

export const PACING_COLORS: Record<PacingStatus, string> = {
  SLOW: '#f59e0b',
  OPTIMAL: '#10b981',
  FAST: '#8b5cf6',
  UNKNOWN: '#9ca3af',
}

export const PACING_LABELS: Record<PacingStatus, string> = {
  SLOW: 'Slow',
  OPTIMAL: 'Optimal',
  FAST: 'Fast',
  UNKNOWN: 'Unknown',
}

export function signalTooltip(key: keyof VideoAnalyticsSignals, value: string): string {
  if (value === 'OK') return 'OK'
  if (key === 'heatmap') return 'Videos under ~10k views usually do not have a public heatmap.'
  if (key === 'transcript') return 'No captions/subtitles available for this video.'
  if (key === 'comments')
    return value === 'DISABLED'
      ? 'Comments are disabled on this video.'
      : 'No comments mentioning timestamps found.'
  if (key === 'visual') return 'Could not load YouTube preview thumbnails for this video.'
  return value
}