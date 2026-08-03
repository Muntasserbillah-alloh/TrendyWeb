export interface Region {
  id: number
  name: string
  code: string
  country_codes: string[]
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type UserRole = 'admin' | 'editor' | 'viewer'

export interface AuthUser {
  id: number
  email: string
  role: UserRole
}

export interface AuthTokenPairResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: AuthUser
}

export interface AuthAccessTokenResponse {
  access_token: string
  token_type: string
}

export interface AuthLoginRequest {
  email: string
  password: string
}

export interface AuthRefreshRequest {
  refresh_token: string
}

export interface AuthRegisterRequest {
  email: string
  password: string
  role?: UserRole
}

export interface ManagedAuthUser {
  id: number
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthUsersListResponse {
  data: ManagedAuthUser[]
  meta: {
    total: number
  }
}

export interface AuthUpdateUserRequest {
  email?: string
  password?: string
  role?: UserRole
  is_active?: boolean
}

export interface Trend {
  id: number
  title: string
  platform: 'youtube' | 'google_trends' | 'tiktok' | 'twitter'
  volume: number | null
  url: string | null
  trend_date: string
  rank: number | null
  category: Category | null
  region: Region
  created_at: string
}

export interface TrendPreviewItem {
  title: string
  platform: Trend['platform']
  volume: number | null
  url: string | null
  trend_date: string
  rank: number | null
  category_name: string | null
}

export interface Video {
  id?: number
  video_id: string
  title: string
  description?: string | null
  channel_id?: string
  channel_title: string
  channel_subscribers: number | null
  view_count: number
  like_count: number | null
  comment_count: number | null
  published_at: string
  duration_seconds: number | null
  video_type?: 'shorts' | 'normal'
  default_language?: string | null
  thumbnail_url: string | null
  tags?: string[]
  topic?: string
  region_id?: number | null
  snippet_category_id?: string | number | null
  country_code?: string
  outlier_score: number | null
  is_outlier: boolean
  category?: Category | null
  region?: Region | null
  created_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { page: number; per_page: number; total: number; pages: number }
}

export interface TrendAnalysis {
  region: string
  by_category: { category: string; count: number; avg_volume: number; max_volume: number }[]
  by_platform: { platform: string; count: number; avg_volume: number; max_volume: number }[]
  by_date: { trend_date: string; count: number; avg_volume: number; max_volume: number }[]
}

export type YoutubeCompetitionLevel = 'low' | 'moderate' | 'high' | 'very_high'

export interface TopicOutlierVideo {
  video_id?: string
  title: string
  channel_title: string
  view_count: number
  channel_subscribers: number | null
  outlier_score: number
  thumbnail_url?: string | null
}

export interface TopicAnalysis {
  topic: string
  region: string | null
  videos_analyzed: number
  stats: {
    avg_views: number
    median_views: number
    max_views: number
    min_views: number
    avg_likes: number
    avg_comments: number
    engagement_rate: number
  }
  outlier_summary: {
    total_outliers: number
    avg_outlier_score: number
    max_outlier_score: number
  }
  channel_size_breakdown: {
    tier: string
    video_count: number
    avg_views: number
    avg_outlier_score: number
  }[]
  top_outliers: TopicOutlierVideo[]
  opportunity_score: number
  competition_level: {
    level: YoutubeCompetitionLevel
    description: string
  }
  best_posting_patterns: {
    best_days: string[]
    best_hours: number[]
  }
}

export type VideoIdeaSuggestionType = 'duration' | 'opportunity' | 'benchmark' | string

export interface VideoIdeaSuggestion {
  type: VideoIdeaSuggestionType
  tip: string
  reason: string
  examples?: string[]
}

export interface VideoIdeas {
  topic: string
  region: string | null
  outlier_count: number
  patterns: {
    high_performing_titles: string[]
    common_view_range: { min: number; max: number; median: number }
    optimal_duration: {
      avg_seconds: number
      sweet_spot: {
        min_seconds: number
        max_seconds: number
        min_display: string
        max_display: string
      }
    }
    channels_that_went_viral: string[]
    small_channels_winning: {
      title: string
      channel: string
      subs: number
      views: number
    }[]
  }
  suggestions: VideoIdeaSuggestion[]
}

export interface SearchResult {
  topic: string
  region: string | null
  country_codes_searched: string[]
  count: number
  outliers_found: number
  video_type_filter?: 'shorts' | 'normal' | 'all'
  videos: Video[]
}

export interface TrendsGroupedItem {
  category?: string
  platform?: string
  trend_date?: string
  count: number
  avg_volume: number
  max_volume: number
}

export interface TrendFilters {
  platform?: Trend['platform']
  region_code?: string
  category_id?: number
  date_from?: string
  date_to?: string
  min_volume?: number
  topic?: string
  page?: number
  per_page?: number
}

export interface OutlierFilters {
  topic?: string
  region_code?: string
  min_score?: number
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
}

export interface YoutubeScopedDateFilters {
  region_code?: string
  date_from?: string
  date_to?: string
}

export interface YoutubeHashtagItem {
  hashtag: string
  frequency: number
  usage_percent: number
}

export interface YoutubeRecommendedTag {
  tag: string
  frequency: number
  relevance_score: number
}

export interface YoutubeTagCombination {
  tags: string[]
  frequency: number
}

export interface YoutubeHashtagSummary {
  videos_analyzed: number
  unique_tags_found: number
  unique_hashtags_found: number
}

export interface YoutubeHashtagsResponse {
  topic: string
  region: string | null
  trending_hashtags: YoutubeHashtagItem[]
  recommended_tags: YoutubeRecommendedTag[]
  tag_combinations: YoutubeTagCombination[]
  summary: YoutubeHashtagSummary
}

export interface YoutubeChannelOutlier {
  title: string
  views: number
}

export interface YoutubeChannelAnalysis {
  channel_id: string
  channel_title: string
  subscribers: number
  total_videos: number
  total_views: number
  videos_analyzed: number
  performance: {
    avg_views: number
    median_views: number
    max_views: number
    min_views: number
    consistency_score: number
  }
  outliers: {
    count: number
    videos: YoutubeChannelOutlier[]
  }
  growth_indicators: {
    trend: 'growing' | 'stable' | 'declining'
    recent_avg_views: number
    older_avg_views: number
    growth_ratio: number
  }
}

export interface YoutubeTrendingTopic {
  topic: string
  frequency: number
  total_views: number
  score: number
}

export interface YoutubeTrendingCategory {
  category: string
  count: number
  percentage: number
}

export interface YoutubeTrendingChannel {
  channel: string
  trending_videos: number
}

export interface YoutubeTrendingResponse {
  region: string
  country_codes_checked: string[]
  videos_analyzed: number
  trending_topics: YoutubeTrendingTopic[]
  trending_categories: YoutubeTrendingCategory[]
  top_channels: YoutubeTrendingChannel[]
}

export interface TrendingVideo extends Video {
  description?: string
  country_code?: string
}

export interface TrendingVideosResult {
  region: string
  country_codes_searched: string[]
  count: number
  outliers_found: number
  video_type_filter: 'all' | 'shorts' | 'normal'
  videos: TrendingVideo[]
}

export type YoutubeCollectionSource = 'search' | 'trending'

export type YoutubeSaveVideoPayload = Record<string, unknown>

export interface SaveYoutubeCollectionParams {
  name: string
  collection_id?: number | null
  videos: YoutubeSaveVideoPayload[]
  source?: YoutubeCollectionSource
  topic?: string
  region_code?: string
  category_id?: number
  video_type_filter?: 'all' | 'shorts' | 'normal'
  description?: string
}

export interface YoutubeCollectionSummary {
  id: number
  name: string
  description: string | null
  source: YoutubeCollectionSource
  topic: string | null
  region_code?: string | null
  region_id?: number | null
  category_id: number | null
  video_type_filter: 'all' | 'shorts' | 'normal' | null
  video_count: number
  created_at: string
  updated_at: string
}

export interface YoutubeCollectionsResponse {
  data: YoutubeCollectionSummary[]
  meta: {
    total: number
  }
}

export interface YoutubeCollectionDetail extends YoutubeCollectionSummary {
  videos: Video[]
}

export interface YoutubeSaveCollectionResult {
  collection: YoutubeCollectionSummary
  added_count: number
  action: 'created' | 'appended'
}

export interface FetchTrendsParams {
  region_code: string
  topic?: string
  min_volume?: number
  category?: string
  platforms?: string[]
  date_from?: string
  date_to?: string
  country_codes?: string[]
  limit?: number
}

export interface FetchTrendsResponse {
  region: string
  count: number
  date: string
  filters_applied: Record<string, unknown>
  platforms_queried: Trend['platform'][]
  trends: TrendPreviewItem[]
}

export interface SaveTrendsParams {
  region_code: string
  trends: TrendPreviewItem[]
}

export interface SaveTrendsResponse {
  region: string
  count: number
  date: string
}

export interface VelocityItem {
  title: string
  platform: Trend['platform']
  current_volume: number
  previous_volume: number
  velocity: number
  status: 'new' | 'rising' | 'stable' | 'falling'
}

export interface CrossPlatformItem {
  title: string
  platforms: Trend['platform'][]
  total_volume: number
  platform_count: number
}

export interface CreatorRecommendation {
  title: string
  creator_score: number
  volume: number
  platforms: Trend['platform'][]
  recency: string
  reason: string
}

export interface OpportunityResult {
  topic: string
  score: number
  demand: number
  supply: number
  competition_level: 'low' | 'medium' | 'high' | 'very_high'
  growth_trajectory: { date: string; score: number }[]
  recommendation: string
}

export interface SaturationResult {
  topic: string
  supply: number
  demand: number
  saturation_level: 'unsaturated' | 'low' | 'moderate' | 'high' | 'oversaturated'
}

export interface RelatedTopic {
  topic: string
  relevance: number
  volume?: number
}

export interface CalendarDay {
  date: string
  recommended_categories: string[]
  hot_topics: string[]
}

export interface ClassifiedTrend {
  title: string
  platform: Trend['platform']
  volume: number
  classification: 'evergreen' | 'rising' | 'viral_spike' | 'declining' | 'emerging'
}

export interface PlannerExploreParams {
  topic: string
  region_code: string
  min_volume?: number
  platforms?: Trend['platform'][]
  limit?: number
}

export interface PlannerExploreGroup {
  group_name: string
  description: string
  trends: TrendPreviewItem[]
  count: number
  insights: string[]
}

export interface PlannerExploreResult {
  topic: string
  region: string
  total_trends: number
  groups: PlannerExploreGroup[]
  filters: Record<string, unknown>
}

export type PacingStatus = 'SLOW' | 'OPTIMAL' | 'FAST' | 'UNKNOWN'

export interface VideoAnalyticsSignals {
  heatmap: 'OK' | 'LOW_DATA'
  transcript: 'OK' | 'NO_TRANSCRIPT'
  comments: 'OK' | 'NO_COMMENTS' | 'DISABLED'
  visual: 'OK' | 'NO_STORYBOARD'
}

export interface VideoAnalyticsBucket {
  timestamp_start: number
  timestamp_end: number
  heatmap_score: number | null
  wpm: number | null
  pacing_status: PacingStatus
  comment_mentions: number
  visual_change_score: number | null
  drop_risk_score: number
  flag_alert: boolean
}

export interface VideoAnalyticsSummaryDiagnostics {
  total_detected_drop_zones: number
  total_buckets: number
  video_duration_sec: number
  average_spoken_wpm: number | null
  peak_engagement_timestamp: string | null
}

export interface VideoAnalyticsResponse {
  video_id: string
  analyzed_at: string
  signals: VideoAnalyticsSignals
  summary_diagnostics: VideoAnalyticsSummaryDiagnostics
  timeline_analysis: VideoAnalyticsBucket[]
  thumbnail_url: string | null
}

export interface VideoAnalyticsRequest {
  video_id: string
  bucket_size_sec?: number
  languages?: string[]
  max_comment_pages?: number
}
