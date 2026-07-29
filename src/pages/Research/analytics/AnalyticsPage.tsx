import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Alert, Button, Card, Skeleton, Space, Typography } from 'antd'
import { ExternalLink, Link2 } from 'lucide-react'
import type { VideoAnalyticsBucket, VideoAnalyticsRequest, VideoAnalyticsResponse } from '../../../types'
import { useVideoAnalytics } from '../../../hooks/useYoutube'
import { SignalBadges } from './SignalBadges'
import { SummaryCards } from './SummaryCards'
import { RetentionChart } from './RetentionChart'
import { BucketDetailDrawer } from './BucketDetailDrawer'
import { VideoIdForm } from './VideoIdForm'
import {
  DEFAULT_ADVANCED,
  type AdvancedAnalyticsOptions,
  parseTimestampToSec,
} from './analyticsUtils'

const EXAMPLE_IDS = ['dQw4w9WgXcQ', '9bZkp7q19f0', 'kJQP7kiw4Fk']

type ErrorState =
  | { kind: 'none' }
  | { kind: 'playability'; message: string }
  | { kind: 'misconfigured'; message: string }
  | { kind: 'validation'; message: string }
  | { kind: 'other'; message: string }

function classifyError(error: unknown): ErrorState {
  if (!error) return { kind: 'none' }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const msg = error.message ?? ''
    const responseData = error.response?.data as
      | { error?: { details?: unknown; message?: string } }
      | undefined
    if (status === 422 && msg.startsWith('Video cannot be analyzed')) {
      const reason = msg.replace(/^Video cannot be analyzed:\s*/, '') || msg
      return { kind: 'playability', message: reason }
    }
    if (status === 400 || msg.includes('YOUTUBE_API_KEY')) {
      return {
        kind: 'misconfigured',
        message: 'Ask an admin to set YOUTUBE_API_KEY on the backend.',
      }
    }
    if (status === 422) {
      const details = responseData?.error?.details
      const detailStr =
        details && typeof details === 'object'
          ? Object.values(details as Record<string, string>).join('; ')
          : responseData?.error?.message ?? msg
      return { kind: 'validation', message: detailStr || 'Validation failed.' }
    }
    return { kind: 'other', message: msg || 'Unexpected error.' }
  }
  return {
    kind: 'other',
    message: error instanceof Error ? error.message : 'Unexpected error.',
  }
}

// ponytail: user-facing strings are hard-coded English; the repo has no i18n lib (no i18next/react-intl,
// every other page is English-only). Add an i18n helper + EN/AR catalogs when the app adopts localization.
export function AnalyticsPage() {
  const { videoId: paramVideoId } = useParams<{ videoId?: string }>()
  const navigate = useNavigate()
  const { mutate, isPending, error } = useVideoAnalytics()

  const [input, setInput] = useState(paramVideoId ?? '')
  const [advanced, setAdvanced] = useState<AdvancedAnalyticsOptions>(DEFAULT_ADVANCED)
  const [result, setResult] = useState<VideoAnalyticsResponse | null>(null)
  const [selected, setSelected] = useState<VideoAnalyticsBucket | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const [lastAttempt, setLastAttempt] = useState<string | null>(null)

  const autoRanRef = useRef<string | null>(null)

  const runMutation = useCallback(
    (id: string, opts: AdvancedAnalyticsOptions) => {
      const langArr = opts.languages
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const body: VideoAnalyticsRequest = {
        video_id: id,
        bucket_size_sec: opts.bucket_size_sec,
        max_comment_pages: opts.max_comment_pages,
        ...(langArr.length ? { languages: langArr } : {}),
      }
      mutate(body, {
        onSuccess: (resp) => {
          setResult(resp)
          navigate(`/youtube/analytics/${resp.video_id}`, { replace: true })
        },
      })
    },
    [mutate, navigate],
  )

  function analyzeVideo(id: string) {
    setLastAttempt(id)
    setSelected(null)
    setDrawerOpen(false)
    setElapsed(0)
    runMutation(id, advanced)
  }

  // Deep-link: pre-fill + auto-run once with default options.
  useEffect(() => {
    const p = paramVideoId
    if (!p) return
    if (result?.video_id === p) return
    if (autoRanRef.current === p) return
    autoRanRef.current = p
    runMutation(p, DEFAULT_ADVANCED)
  }, [paramVideoId, result, runMutation])

  // Elapsed-seconds timer while a request is pending.
  useEffect(() => {
    if (!isPending) return
    const start = Date.now()
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500)
    return () => clearInterval(t)
  }, [isPending])

  const errorState = useMemo(() => classifyError(error), [error])
  const serverValidationError = errorState.kind === 'validation' ? errorState.message : null

  const partialBanner = useMemo(() => {
    if (!result) return null
    const present = {
      heatmap: result.signals.heatmap === 'OK' || result.signals.heatmap === 'LOW_DATA',
      transcript: result.signals.transcript === 'OK',
      comments: result.signals.comments === 'OK',
      visual: result.signals.visual === 'OK',
    }
    const count = Object.values(present).filter(Boolean).length
    if (count === 4 || count === 0) return null
    return count
  }, [result])

  const allNeutral = useMemo(() => {
    if (!result) return false
    const anyPresent =
      result.signals.heatmap === 'OK' ||
      result.signals.heatmap === 'LOW_DATA' ||
      result.signals.transcript === 'OK' ||
      result.signals.comments === 'OK' ||
      result.signals.visual === 'OK'
    if (anyPresent) return false
    return (
      result.summary_diagnostics.total_buckets === 1 &&
      result.timeline_analysis.every((b) => b.drop_risk_score === 0.5)
    )
  }, [result])

  const peakSec = result ? parseTimestampToSec(result.summary_diagnostics.peak_engagement_timestamp) : null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const showResults = result && !isPending
  const showError = !isPending && errorState.kind !== 'none' && errorState.kind !== 'validation'
  const showIdle = !result && !isPending && errorState.kind === 'none' && !paramVideoId

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Space direction="vertical" size={0}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Video Retention Analytics
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Reverse-engineer the retention curve of a public YouTube video — where viewers rewind, skip, or drop off.
        </Typography.Text>
      </Space>

      <VideoIdForm
        value={input}
        onChange={setInput}
        onSubmit={analyzeVideo}
        isLoading={isPending}
        elapsedSeconds={elapsed}
        advanced={advanced}
        onAdvancedChange={setAdvanced}
        serverError={serverValidationError}
      />

      {isPending && (
        <Card>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      )}

      {showError && (
        <Alert
          type={errorState.kind === 'misconfigured' ? 'warning' : 'error'}
          showIcon
          message={
            errorState.kind === 'playability'
              ? 'Cannot analyze this video'
              : errorState.kind === 'misconfigured'
                ? 'Service misconfigured'
                : 'Something went wrong'
          }
          description={
            <Space direction="vertical" size={8}>
              <span>{errorState.message}</span>
              {(errorState.kind === 'other' || errorState.kind === 'misconfigured') && (
                <Button
                  size="small"
                  onClick={() => {
                    if (lastAttempt) analyzeVideo(lastAttempt)
                  }}
                >
                  Retry
                </Button>
              )}
            </Space>
          }
          style={{ margin: '4px 0' }}
        />
      )}

      {showIdle && (
        <Card>
          <Typography.Paragraph type="secondary">
            Paste a public YouTube video URL or ID above to analyze it. Drop-risk buckets, pacing,
            comment clusters, and visual cuts are combined into one retention curve. Analysis of long
            videos can take 5–25 seconds.
          </Typography.Paragraph>
          <Space size={8} wrap>
            <Typography.Text type="secondary">Try:</Typography.Text>
            {EXAMPLE_IDS.map((id) => (
              <Button
                key={id}
                type="link"
                style={{ padding: 0 }}
                onClick={() => {
                  setInput(id)
                  analyzeVideo(id)
                }}
              >
                {id}
              </Button>
            ))}
          </Space>
        </Card>
      )}

      {showResults && result && (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <SignalBadges signals={result.signals} />
            <Space size={8}>
              <Button icon={<Link2 size={14} />} onClick={copyLink}>
                {copied ? 'Copied!' : 'Copy link'}
              </Button>
              <Button
                icon={<ExternalLink size={14} />}
                href={`https://www.youtube.com/watch?v=${result.video_id}${
                  peakSec != null ? `&t=${Math.round(peakSec)}s` : ''
                }`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on YouTube
              </Button>
            </Space>
          </div>

          {partialBanner != null && (
            <Alert
              type="info"
              showIcon
              message={`Partial analysis: showing ${partialBanner} of 4 signals. Missing layers are omitted, not shown as zero.`}
            />
          )}

          {allNeutral ? (
            <Card>
              <Space direction="vertical" size={12}>
                <Typography.Text strong>
                  Couldn't extract any signals from this video.
                </Typography.Text>
                <Typography.Text type="secondary">
                  The backend couldn't produce a retention curve for this video. See the signal
                  statuses below for why each signal was unavailable.
                </Typography.Text>
                <SignalBadges signals={result.signals} />
              </Space>
            </Card>
          ) : (
            <>
              <SummaryCards data={result} />
              <RetentionChart
                data={result}
                onBucketClick={(b) => {
                  setSelected(b)
                  setDrawerOpen(true)
                }}
              />
            </>
          )}
        </Space>
      )}

      <BucketDetailDrawer
        open={drawerOpen}
        bucket={selected}
        videoId={result?.video_id ?? null}
        onClose={() => setDrawerOpen(false)}
      />
    </Space>
  )
}