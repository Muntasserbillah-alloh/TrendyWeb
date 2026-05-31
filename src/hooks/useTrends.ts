import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchPreviewTrends,
  getCreatorRecommendations,
  getCrossPlatform,
  getTrendAnalysis,
  getTrends,
  getTrendsGrouped,
  saveSelectedTrends,
  getVelocity,
} from '../api/trends'
import type { FetchTrendsParams, SaveTrendsParams, TrendFilters } from '../types'

export function useTrends(filters: TrendFilters = {}) {
  return useQuery({
    queryKey: ['trends', filters],
    queryFn: () => getTrends(filters),
  })
}

export function useTrendAnalysis(regionCode: string | undefined) {
  return useQuery({
    queryKey: ['trend-analysis', regionCode],
    queryFn: () => getTrendAnalysis(regionCode!),
    enabled: !!regionCode,
  })
}

export function useTrendsGrouped(
  regionCode: string | undefined,
  groupBy: 'category' | 'platform' | 'date' = 'category'
) {
  return useQuery({
    queryKey: ['trends-grouped', regionCode, groupBy],
    queryFn: () => getTrendsGrouped(regionCode!, groupBy),
    enabled: !!regionCode,
  })
}

export function useFetchPreviewTrends() {
  return useMutation({
    mutationFn: ({ params, signal }: { params: FetchTrendsParams; signal?: AbortSignal }) =>
      fetchPreviewTrends(params, signal),
  })
}

export function useSaveSelectedTrends() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: SaveTrendsParams) => saveSelectedTrends(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trends'] })
      void queryClient.invalidateQueries({ queryKey: ['trend-analysis'] })
    },
  })
}

export function useVelocity(regionCode: string | undefined, days: number = 7) {
  return useQuery({
    queryKey: ['velocity', regionCode, days],
    queryFn: () => getVelocity(regionCode!, days),
    enabled: !!regionCode,
  })
}

export function useCrossPlatform(regionCode: string | undefined, minPlatforms: number = 2) {
  return useQuery({
    queryKey: ['cross-platform', regionCode, minPlatforms],
    queryFn: () => getCrossPlatform(regionCode!, minPlatforms),
    enabled: !!regionCode,
  })
}

export function useCreatorRecommendations(regionCode: string | undefined, params?: { category?: string; min_volume?: number; limit?: number }) {
  return useQuery({
    queryKey: ['creator-recommendations', regionCode, params],
    queryFn: () => getCreatorRecommendations(regionCode!, params),
    enabled: !!regionCode,
  })
}
