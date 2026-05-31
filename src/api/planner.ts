import { apiClient } from './client'
import { compactQueryParams, toCommaSeparated } from '../utils'
import type {
  CalendarDay,
  ClassifiedTrend,
  OpportunityResult,
  PlannerExploreParams,
  PlannerExploreResult,
  RelatedTopic,
  SaturationResult,
} from '../types'

export async function getOpportunity(params: { topic: string; region_code?: string }): Promise<{ data: OpportunityResult }> {
  const { data } = await apiClient.post('/api/v1/planner/opportunity', params)
  return data
}

export async function exploreIdeas(
  params: PlannerExploreParams,
  signal?: AbortSignal
): Promise<{ data: PlannerExploreResult }> {
  const queryParams = compactQueryParams({
    topic: params.topic,
    region_code: params.region_code,
    min_volume: params.min_volume,
    platforms: toCommaSeparated(params.platforms),
    limit: params.limit,
  })

  const { data } = await apiClient.get('/api/v1/planner/explore', {
    params: queryParams,
    signal,
  })
  return data
}

export async function getCalendar(regionCode: string, params?: { days_ahead?: number; categories?: string }): Promise<{ data: CalendarDay[] }> {
  const { data } = await apiClient.get(`/api/v1/planner/calendar/${regionCode}`, { params })
  return data
}

export async function getSaturation(params: { topic: string; region_code?: string }): Promise<{ data: SaturationResult }> {
  const { data } = await apiClient.post('/api/v1/planner/saturation', params)
  return data
}

export async function getRelatedTopics(params: { topic: string; region_code?: string; limit?: number }): Promise<{ data: RelatedTopic[] }> {
  const { data } = await apiClient.post('/api/v1/planner/related', params)
  return data
}

export async function getClassification(regionCode: string, days?: number): Promise<{ data: ClassifiedTrend[] }> {
  const { data } = await apiClient.get(`/api/v1/planner/classify/${regionCode}`, { params: days ? { days } : undefined })
  return data
}
