import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getChannelAnalysis,
  getHashtags,
  getOutliers,
  getYoutubeCollectionDetail,
  getYoutubeCollections,
  saveYoutubeCollection,
  getTopicAnalysis,
  getTrendingTopics,
  getTrendingVideos,
  getVideoAnalytics,
  getVideoIdeas,
  searchYoutube,
} from '../api/youtube'
import type {
  OutlierFilters,
  SaveYoutubeCollectionParams,
  VideoAnalyticsRequest,
  YoutubeScopedDateFilters,
} from '../types'
import type {
  TrendingVideosParams,
  YoutubeCollectionsParams,
  YoutubeDateRangeParams,
  YoutubeSearchParams,
  YoutubeTrendingParams,
} from '../api/youtube'

export function useYoutubeSearch() {
  return useMutation({
    mutationFn: (params: YoutubeSearchParams) => searchYoutube(params),
  })
}

export function useOutliers(filters: OutlierFilters = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['outliers', filters],
    queryFn: () => getOutliers(filters),
    enabled: options?.enabled ?? true,
  })
}

export function useTopicAnalysis(topic: string | undefined, regionCode?: string) {
  return useQuery({
    queryKey: ['topic-analysis', topic, regionCode],
    queryFn: () => getTopicAnalysis(topic!, { region_code: regionCode }),
    enabled: !!topic,
  })
}

export function useTopicAnalysisWithFilters(
  topic: string | undefined,
  filters: YoutubeScopedDateFilters = {}
) {
  return useQuery({
    queryKey: ['topic-analysis', topic, filters],
    queryFn: () => getTopicAnalysis(topic!, filters),
    enabled: !!topic,
  })
}

export function useVideoIdeas(topic: string | undefined, regionCode?: string) {
  return useQuery({
    queryKey: ['video-ideas', topic, regionCode],
    queryFn: () => getVideoIdeas(topic!, { region_code: regionCode }),
    enabled: !!topic,
  })
}

export function useVideoIdeasWithFilters(
  topic: string | undefined,
  filters: YoutubeScopedDateFilters = {}
) {
  return useQuery({
    queryKey: ['video-ideas', topic, filters],
    queryFn: () => getVideoIdeas(topic!, filters),
    enabled: !!topic,
  })
}

export function useHashtags(topic: string | undefined, filters: YoutubeScopedDateFilters = {}) {
  return useQuery({
    queryKey: ['youtube-hashtags', topic, filters],
    queryFn: () => getHashtags(topic!, filters),
    enabled: !!topic,
  })
}

export function useChannelAnalysis(
  channelId: string | undefined,
  params: YoutubeDateRangeParams = {}
) {
  return useQuery({
    queryKey: ['youtube-channel-analysis', channelId, params],
    queryFn: () => getChannelAnalysis(channelId!, params),
    enabled: !!channelId,
  })
}

export function useTrendingTopics(
  params: YoutubeTrendingParams = {},
  options?: { autoRefresh?: boolean }
) {
  return useQuery({
    queryKey: ['youtube-trending', params],
    queryFn: () => getTrendingTopics(params),
    refetchInterval: options?.autoRefresh ? 6 * 60 * 60 * 1000 : false,
  })
}

export function useTrendingVideos() {
  return useMutation({
    mutationFn: (params: TrendingVideosParams) => getTrendingVideos(params),
  })
}

export function useYoutubeCollections(
  params: YoutubeCollectionsParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['youtube-collections', params],
    queryFn: () => getYoutubeCollections(params),
    enabled: options?.enabled ?? true,
  })
}

export function useYoutubeCollectionDetail(
  collectionId: number | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['youtube-collections', collectionId],
    queryFn: () => getYoutubeCollectionDetail(collectionId!),
    enabled: (options?.enabled ?? true) && typeof collectionId === 'number',
  })
}

export function useSaveYoutubeCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: SaveYoutubeCollectionParams) => saveYoutubeCollection(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['youtube-collections'] })
      void queryClient.invalidateQueries({ queryKey: ['outliers'] })
    },
  })
}

export function useVideoAnalytics(getSignal?: () => AbortSignal | undefined) {
  return useMutation({
    mutationFn: (params: VideoAnalyticsRequest) => getVideoAnalytics(params, getSignal?.()),
  })
}
