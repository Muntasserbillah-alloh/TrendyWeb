import type { YoutubeCollectionSource, YoutubeSaveVideoPayload } from '../types'

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function buildYoutubeCollectionDefaultName(params: {
  topic?: string
  regionCode?: string
  source: YoutubeCollectionSource
  now?: Date
}): string {
  const { topic, regionCode, source, now = new Date() } = params
  const topicLabel = topic?.trim() || (source === 'trending' ? 'trending' : 'search')
  const regionLabel = regionCode?.trim() || 'Global'
  return `${topicLabel} - ${regionLabel} - ${formatMonthYear(now)}`
}

export function buildYoutubeSaveVideosPayload(videos: unknown[]): YoutubeSaveVideoPayload[] {
  return videos
    .filter((video): video is Record<string, unknown> => typeof video === 'object' && video !== null)
    .map((video) => ({ ...video }))
}
