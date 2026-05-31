import { useEffect, useMemo, useState } from 'react'
import type { Video } from '../types'

function getStorageKey(scope: string, userScope?: string | number): string {
  const normalizedUserScope =
    typeof userScope === 'number' || typeof userScope === 'string'
      ? String(userScope).trim()
      : ''

  if (!normalizedUserScope) {
    return `trendy:youtube:selected-videos:anon:${scope}`
  }

  return `trendy:youtube:selected-videos:${normalizedUserScope}:${scope}`
}

function readStoredSelection(scope: string, userScope?: string | number): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.sessionStorage.getItem(getStorageKey(scope, userScope))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

export function useYoutubeVideoSelection(
  scope: string,
  videos: Video[],
  userScope?: string | number
) {
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(
    () => new Set(readStoredSelection(scope, userScope))
  )

  useEffect(() => {
    setSelectedVideoIds(new Set(readStoredSelection(scope, userScope)))
  }, [scope, userScope])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storageKey = getStorageKey(scope, userScope)
    window.sessionStorage.setItem(storageKey, JSON.stringify(Array.from(selectedVideoIds)))
  }, [scope, selectedVideoIds, userScope])

  const availableVideoIds = useMemo(
    () => new Set(videos.map((video) => video.video_id)),
    [videos]
  )

  const selectedCount = useMemo(() => {
    let count = 0
    selectedVideoIds.forEach((videoId) => {
      if (availableVideoIds.has(videoId)) count += 1
    })
    return count
  }, [availableVideoIds, selectedVideoIds])

  const toggleSelection = (videoId: string, checked: boolean) => {
    setSelectedVideoIds((current) => {
      const next = new Set(current)
      if (checked) next.add(videoId)
      else next.delete(videoId)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedVideoIds(new Set())
  }

  const selectAll = () => {
    setSelectedVideoIds(new Set(videos.map((video) => video.video_id)))
  }

  const selectOutliersOnly = () => {
    setSelectedVideoIds(
      new Set(videos.filter((video) => video.is_outlier).map((video) => video.video_id))
    )
  }

  const invertSelection = () => {
    setSelectedVideoIds((current) => {
      const next = new Set<string>()
      videos.forEach((video) => {
        if (!current.has(video.video_id)) {
          next.add(video.video_id)
        }
      })
      return next
    })
  }

  const selectedVideos = useMemo(
    () => videos.filter((video) => selectedVideoIds.has(video.video_id)),
    [selectedVideoIds, videos]
  )

  return {
    selectedVideoIds,
    selectedVideos,
    selectedCount,
    toggleSelection,
    clearSelection,
    selectAll,
    selectOutliersOnly,
    invertSelection,
  }
}
