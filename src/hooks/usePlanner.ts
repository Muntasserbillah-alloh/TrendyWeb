import { useMutation, useQuery } from '@tanstack/react-query'
import { exploreIdeas, getCalendar, getClassification, getOpportunity, getRelatedTopics, getSaturation } from '../api/planner'
import type { PlannerExploreParams } from '../types'

export function useOpportunity() {
  return useMutation({
    mutationFn: (params: { topic: string; region_code?: string }) => getOpportunity(params),
  })
}

export function useExploreIdeas() {
  return useMutation({
    mutationFn: ({ params, signal }: { params: PlannerExploreParams; signal?: AbortSignal }) =>
      exploreIdeas(params, signal),
  })
}

export function useSaturation() {
  return useMutation({
    mutationFn: (params: { topic: string; region_code?: string }) => getSaturation(params),
  })
}

export function useRelatedTopics() {
  return useMutation({
    mutationFn: (params: { topic: string; region_code?: string; limit?: number }) => getRelatedTopics(params),
  })
}

export function useCalendar(regionCode: string | undefined, daysAhead: number = 14) {
  return useQuery({
    queryKey: ['calendar', regionCode, daysAhead],
    queryFn: () => getCalendar(regionCode!, { days_ahead: daysAhead }),
    enabled: !!regionCode,
  })
}

export function useClassification(regionCode: string | undefined, days: number = 14) {
  return useQuery({
    queryKey: ['classification', regionCode, days],
    queryFn: () => getClassification(regionCode!, days),
    enabled: !!regionCode,
  })
}
