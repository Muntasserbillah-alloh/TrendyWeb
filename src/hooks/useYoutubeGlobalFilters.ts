import { useEffect, useState } from 'react'

const YOUTUBE_FILTERS_STORAGE_KEY = 'trendy:youtube:global-filters'

export type YoutubeDatePreset = '7d' | '30d' | '90d' | '365d' | 'custom'

export interface YoutubeGlobalFiltersState {
  region_code?: string
  date_from: string
  date_to: string
  preset: YoutubeDatePreset
}

export const YOUTUBE_DATE_PRESET_OPTIONS: Array<{ value: YoutubeDatePreset; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '365d', label: 'Last year' },
  { value: 'custom', label: 'Custom' },
]

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

function getPresetRange(preset: Exclude<YoutubeDatePreset, 'custom'>): {
  date_from: string
  date_to: string
} {
  const today = new Date()
  const dateTo = toDateInputValue(today)

  if (preset === '7d') {
    return { date_from: toDateInputValue(addDays(today, -7)), date_to: dateTo }
  }

  if (preset === '90d') {
    return { date_from: toDateInputValue(addDays(today, -90)), date_to: dateTo }
  }

  if (preset === '365d') {
    return { date_from: toDateInputValue(addDays(today, -365)), date_to: dateTo }
  }

  return { date_from: toDateInputValue(addDays(today, -30)), date_to: dateTo }
}

function normalizeStoredState(value: unknown): YoutubeGlobalFiltersState | null {
  if (!value || typeof value !== 'object') return null

  const stored = value as Partial<YoutubeGlobalFiltersState>
  if (!stored.date_from || !stored.date_to) return null

  return {
    region_code:
      typeof stored.region_code === 'string' && stored.region_code.trim().length > 0
        ? stored.region_code
        : undefined,
    date_from: stored.date_from,
    date_to: stored.date_to,
    preset: stored.preset ?? '30d',
  }
}

function getInitialFilters(): YoutubeGlobalFiltersState {
  if (typeof window === 'undefined') {
    const presetRange = getPresetRange('30d')
    return {
      region_code: undefined,
      date_from: presetRange.date_from,
      date_to: presetRange.date_to,
      preset: '30d',
    }
  }

  const rawValue = window.localStorage.getItem(YOUTUBE_FILTERS_STORAGE_KEY)
  if (rawValue) {
    try {
      const parsedValue = JSON.parse(rawValue) as unknown
      const normalizedState = normalizeStoredState(parsedValue)
      if (normalizedState) return normalizedState
    } catch {
      // Ignore invalid storage values and fallback to defaults.
    }
  }

  const presetRange = getPresetRange('30d')
  return {
    region_code: undefined,
    date_from: presetRange.date_from,
    date_to: presetRange.date_to,
    preset: '30d',
  }
}

export function useYoutubeGlobalFilters() {
  const [filters, setFilters] = useState<YoutubeGlobalFiltersState>(() => getInitialFilters())

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(YOUTUBE_FILTERS_STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  const setRegionCode = (region_code: string | undefined) => {
    setFilters((prev) => ({ ...prev, region_code }))
  }

  const setPreset = (preset: YoutubeDatePreset) => {
    setFilters((prev) => {
      if (preset === 'custom') return { ...prev, preset }
      return { ...prev, preset, ...getPresetRange(preset) }
    })
  }

  const setDateFrom = (date_from: string) => {
    setFilters((prev) => ({
      ...prev,
      date_from,
      date_to: prev.date_to && date_from > prev.date_to ? date_from : prev.date_to,
      preset: 'custom',
    }))
  }

  const setDateTo = (date_to: string) => {
    setFilters((prev) => ({
      ...prev,
      date_from: prev.date_from && date_to < prev.date_from ? date_to : prev.date_from,
      date_to,
      preset: 'custom',
    }))
  }

  return {
    ...filters,
    setRegionCode,
    setPreset,
    setDateFrom,
    setDateTo,
  }
}
