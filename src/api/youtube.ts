import { apiClient } from './client'
import type {
  OutlierFilters,
  PaginatedResponse,
  YoutubeCollectionDetail,
  YoutubeCollectionsResponse,
  YoutubeCollectionSource,
  SaveYoutubeCollectionParams,
  SearchResult,
  TopicAnalysis,
  TrendingVideosResult,
  Video,
  VideoIdeas,
  YoutubeSaveCollectionResult,
  YoutubeChannelAnalysis,
  YoutubeHashtagsResponse,
  VideoAnalyticsRequest,
  VideoAnalyticsResponse,
  YoutubeScopedDateFilters,
  YoutubeTrendingResponse,
} from '../types'

export interface YoutubeSearchParams extends YoutubeScopedDateFilters {
  topic: string
  max_results?: number
  category_id?: number
  video_type?: 'shorts' | 'normal' | 'all'
}

export interface YoutubeTrendingParams {
  region_code?: string
  category_id?: number
}

export interface YoutubeCollectionsParams {
  source?: YoutubeCollectionSource
  topic?: string
}

export interface TrendingVideosParams {
  region_code: string
  max_results?: number
  category_id?: number
  video_type?: 'all' | 'shorts' | 'normal'
}

export interface YoutubeDateRangeParams {
  date_from?: string
  date_to?: string
}

export async function searchYoutube(params: YoutubeSearchParams): Promise<{ data: SearchResult }> {
  const { data } = await apiClient.post('/api/v1/youtube/search', params)
  return data
}

export async function getOutliers(filters: OutlierFilters = {}): Promise<PaginatedResponse<Video>> {
  const { data } = await apiClient.get('/api/v1/youtube/outliers', { params: filters })
  return data
}

export async function getTopicAnalysis(
  topic: string,
  filters: YoutubeScopedDateFilters = {}
): Promise<{ data: TopicAnalysis }> {
  const { data } = await apiClient.get(`/api/v1/youtube/analysis/${encodeURIComponent(topic)}`, {
    params: filters,
  })
  return data
}

export async function getVideoIdeas(
  topic: string,
  filters: YoutubeScopedDateFilters = {}
): Promise<{ data: VideoIdeas }> {
  const { data } = await apiClient.get(`/api/v1/youtube/ideas/${encodeURIComponent(topic)}`, {
    params: filters,
  })
  return data
}

export async function getTrendingTopics(
  params: YoutubeTrendingParams = {}
): Promise<{ data: YoutubeTrendingResponse }> {
  const { data } = await apiClient.get('/api/v1/youtube/trending', { params })
  return data
}

export async function getHashtags(
  topic: string,
  filters: YoutubeScopedDateFilters = {}
): Promise<{ data: YoutubeHashtagsResponse }> {
  const { data } = await apiClient.get(`/api/v1/youtube/hashtags/${encodeURIComponent(topic)}`, {
    params: filters,
  })
  return data
}

export async function getChannelAnalysis(
  channelId: string,
  params: YoutubeDateRangeParams = {}
): Promise<{ data: YoutubeChannelAnalysis }> {
  const { data } = await apiClient.get(`/api/v1/youtube/channel/${encodeURIComponent(channelId)}`, {
    params,
  })
  return data
}

export async function getTrendingVideos(
  params: TrendingVideosParams
): Promise<{ data: TrendingVideosResult }> {
  const { data } = await apiClient.post('/api/v1/youtube/trending-videos', params)
  return data
}

export async function getYoutubeCollections(
  params: YoutubeCollectionsParams = {}
): Promise<YoutubeCollectionsResponse> {
  const { data } = await apiClient.get('/api/v1/youtube/collections', { params })
  return data
}

export async function getYoutubeCollectionDetail(
  collectionId: number
): Promise<{ data: YoutubeCollectionDetail }> {
  const { data } = await apiClient.get(`/api/v1/youtube/collections/${collectionId}`)
  return data
}

export async function saveYoutubeCollection(
  params: SaveYoutubeCollectionParams
): Promise<{ data: YoutubeSaveCollectionResult }> {
  const { data } = await apiClient.post('/api/v1/youtube/save', params)
  return data
}

export async function getVideoAnalytics(
  params: VideoAnalyticsRequest,
  signal?: AbortSignal
): Promise<VideoAnalyticsResponse> {
  const { data } = await apiClient.post('/api/v1/youtube/analytics', params, {
    signal,
    // ponytail: backend analysis can run long; cap it so a hung request can't leave the Analyze
    // button spinning forever (apiClient has no global timeout).
    timeout: 90_000,
  })
  return data.data
}
