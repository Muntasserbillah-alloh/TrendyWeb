import { apiClient } from './client'
import { compactQueryParams, toCommaSeparated } from '../utils'
import type {
  CreatorRecommendation,
  CrossPlatformItem,
  FetchTrendsParams,
  FetchTrendsResponse,
  PaginatedResponse,
  SaveTrendsParams,
  SaveTrendsResponse,
  Trend,
  TrendAnalysis,
  TrendFilters,
  TrendsGroupedItem,
  VelocityItem,
} from '../types'

export async function getTrends(filters: TrendFilters = {}): Promise<PaginatedResponse<Trend>> {
  const { data } = await apiClient.get('/api/v1/trends/', { params: filters })
  return data
}

export async function fetchPreviewTrends(
  params: FetchTrendsParams,
  signal?: AbortSignal
): Promise<{ data: FetchTrendsResponse }> {
  const queryParams = compactQueryParams({
    region_code: params.region_code,
    topic: params.topic,
    min_volume: params.min_volume,
    category: params.category,
    platforms: toCommaSeparated(params.platforms),
    date_from: params.date_from,
    date_to: params.date_to,
    country_codes: toCommaSeparated(params.country_codes),
    limit: params.limit,
  })

  const { data } = await apiClient.get('/api/v1/trends/fetch', {
    params: queryParams,
    signal,
  })
  return data
}

export async function saveSelectedTrends(params: SaveTrendsParams): Promise<{ data: SaveTrendsResponse }> {
  const { data } = await apiClient.post('/api/v1/trends/save', params)
  return data
}

export async function getTrendsGrouped(
  regionCode: string,
  groupBy: 'category' | 'platform' | 'date' = 'category'
): Promise<{ data: TrendsGroupedItem[] }> {
  const { data } = await apiClient.get(`/api/v1/trends/grouped/${regionCode}`, {
    params: { group_by: groupBy },
  })
  return data
}

export async function getTrendAnalysis(regionCode: string): Promise<{ data: TrendAnalysis }> {
  const { data } = await apiClient.get(`/api/v1/trends/analysis/${regionCode}`)
  return data
}

export async function getVelocity(regionCode: string, days: number = 7): Promise<{ data: VelocityItem[] }> {
  const { data } = await apiClient.get(`/api/v1/trends/velocity/${regionCode}`, { params: { days } })
  return data
}

export async function getCrossPlatform(regionCode: string, minPlatforms: number = 2): Promise<{ data: CrossPlatformItem[] }> {
  const { data } = await apiClient.get(`/api/v1/trends/cross-platform/${regionCode}`, { params: { min_platforms: minPlatforms } })
  return data
}

export async function getCreatorRecommendations(regionCode: string, params?: { category?: string; min_volume?: number; limit?: number }): Promise<{ data: CreatorRecommendation[] }> {
  const { data } = await apiClient.get(`/api/v1/trends/creator/${regionCode}`, { params })
  return data
}
