import { useMemo } from 'react'
import { Card, Empty, Space, Typography } from 'antd'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Customized,
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { VideoAnalyticsBucket, VideoAnalyticsResponse } from '../../../types'
import {
  PACING_COLORS,
  PACING_LABELS,
  formatTs,
  parseTimestampToSec,
  pct,
  siteCommentUrl,
} from './analyticsUtils'

interface ChartInternals {
  xAxisMap?: Record<number, { scale?: (v: number) => number }>
  yAxisMap?: Record<number, { scale?: (v: number) => number }>
  offset?: { top: number; left: number; right: number; bottom: number }
}

interface PinsProps extends ChartInternals {
  buckets: VideoAnalyticsBucket[]
  videoId: string
  hasPins: boolean
}

function PinsAndMarkers(props: PinsProps) {
  const xAxis = props.xAxisMap?.[0]
  const yAxis = props.yAxisMap?.[0]
  if (!xAxis?.scale || !yAxis?.scale) return null

  const xs = xAxis.scale
  const topY = yAxis.scale(1)
  const flags = props.buckets.filter((b) => b.flag_alert)
  const pinBuckets = props.hasPins ? props.buckets.filter((b) => b.comment_mentions > 0) : []
  const maxCount = Math.max(1, ...props.buckets.map((b) => b.comment_mentions))

  return (
    <g>
      {flags.map((b, i) => (
        <text
          key={`flag-${i}`}
          x={xs((b.timestamp_start + b.timestamp_end) / 2)}
          y={topY + 12}
          textAnchor="middle"
          fill="#e11d48"
          fontSize={13}
          pointerEvents="none"
        >
          ⚠
        </text>
      ))}
      {pinBuckets.map((b, i) => {
        const r = 4 + 9 * (b.comment_mentions / maxCount)
        const cx = xs((b.timestamp_start + b.timestamp_end) / 2)
        const cy = topY + r + 22
        return (
          <g
            key={`pin-${i}`}
            onClick={() =>
              window.open(siteCommentUrl(props.videoId, b.timestamp_start), '_blank', 'noopener')
            }
            style={{ cursor: 'pointer' }}
          >
            <circle cx={cx} cy={cy} r={r} fill="#22c55e" fillOpacity={0.85} stroke="#ffffff" strokeWidth={1} />
            <title>{`${b.comment_mentions} comment${b.comment_mentions === 1 ? '' : 's'} · ${formatTs(
              b.timestamp_start,
            )}`}</title>
          </g>
        )
      })}
    </g>
  )
}

interface TooltipRowProps {
  label: string
  children: React.ReactNode
}

function Row({ label, children }: TooltipRowProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, minWidth: 200 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{children}</span>
    </div>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: VideoAnalyticsBucket }>
  showHeatmap: boolean
  showVisual: boolean
  showTranscript: boolean
}

function CustomTooltip({
  active,
  payload,
  showHeatmap,
  showVisual,
  showTranscript,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const b = payload[0].payload
  return (
    <div
      style={{
        background: 'rgba(17,17,17,0.92)',
        border: '1px solid #303030',
        borderRadius: 8,
        padding: '10px 12px',
        color: '#fff',
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        {formatTs(b.timestamp_start)}–{formatTs(b.timestamp_end)}
      </div>
      <Row label="Drop risk">{pct(b.drop_risk_score)}</Row>
      {showHeatmap && <Row label="Heatmap">{pct(b.heatmap_score)}</Row>}
      {showTranscript && (
        <Row label="WPM">
          {b.wpm == null ? '—' : Math.round(b.wpm)}{' '}
          <span style={{ color: PACING_COLORS[b.pacing_status] }}>
            ({PACING_LABELS[b.pacing_status]})
          </span>
        </Row>
      )}
      {showVisual && <Row label="Visual change">{pct(b.visual_change_score)}</Row>}
      <Row label="Comment mentions">{b.comment_mentions}</Row>
    </div>
  )
}

interface Props {
  data: VideoAnalyticsResponse
  onBucketClick: (bucket: VideoAnalyticsBucket) => void
}

export function RetentionChart({ data, onBucketClick }: Props) {
  const timeline = data.timeline_analysis
  const duration = data.summary_diagnostics.video_duration_sec
  const signals = data.signals

  const showHeatmap = signals.heatmap === 'OK' || signals.heatmap === 'LOW_DATA'
  const showPacing = signals.transcript === 'OK'
  const showVisual = signals.visual === 'OK'
  const showPins = signals.comments === 'OK'

  const peakSec = parseTimestampToSec(data.summary_diagnostics.peak_engagement_timestamp)

  const xTicks = useMemo(() => {
    if (!duration) return []
    const n = 6
    return Array.from({ length: n + 1 }, (_, i) => Math.round((duration * i) / n))
  }, [duration])

  if (!timeline.length || !duration) {
    return (
      <Card>
        <Empty description="No timeline data to display." />
      </Card>
    )
  }

  function handleClick(e: unknown) {
    const payload = (e as { activePayload?: Array<{ payload?: VideoAnalyticsBucket }> })?.activePayload?.[0]
      ?.payload
    if (payload) onBucketClick(payload)
  }

  return (
    <Card
      title="Retention Risk Curve"
      extra={
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Click a bucket for detail · click a comment pin to open it on YouTube
        </Typography.Text>
      }
    >
      <div role="figure" aria-label="Composite video retention risk chart with heatmap, pacing, visual change, drop zones, and comment clusters.">
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={timeline} margin={{ top: 16, right: 16, bottom: 8, left: 8 }} onClick={handleClick}>
            <defs>
              <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef2f2" stopOpacity={0.85} />
                <stop offset="50%" stopColor="#fca5a5" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cffafe" stopOpacity={0.7} />
                <stop offset="60%" stopColor="#22d3ee" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="visualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fce7f3" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#db2777" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#303030" strokeOpacity={0.3} />

            <XAxis
              dataKey="timestamp_start"
              type="number"
              domain={[0, duration]}
              scale="linear"
              ticks={xTicks}
              tickFormatter={(v: number) => formatTs(v)}
              stroke="#9ca3af"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickFormatter={(v: number) => pct(v)}
              stroke="#9ca3af"
              tick={{ fontSize: 11 }}
              width={44}
            />

            {showPacing &&
              timeline.map((b, i) => (
                <ReferenceArea
                  key={`pacing-${i}`}
                  x1={b.timestamp_start}
                  x2={b.timestamp_end}
                  y1={0}
                  y2={1}
                  fill={PACING_COLORS[b.pacing_status]}
                  fillOpacity={0.18}
                  stroke="none"
                />
              ))}

            {timeline
              .filter((b) => b.flag_alert)
              .map((b, i) => (
                <ReferenceArea
                  key={`drop-${i}`}
                  x1={b.timestamp_start}
                  x2={b.timestamp_end}
                  y1={0}
                  y2={1}
                  fill="#ef4444"
                  fillOpacity={0.1}
                  stroke="none"
                />
              ))}

            {showVisual && (
              <Area
                name="Visual change"
                type="monotone"
                dataKey="visual_change_score"
                stroke="#ec4899"
                strokeWidth={1.5}
                fill="url(#visualGrad)"
                fillOpacity={0.3}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}

            {showHeatmap && (
              <Area
                name="Heatmap"
                type="monotone"
                dataKey="heatmap_score"
                stroke="#0891b2"
                strokeWidth={1.5}
                fill="url(#heatGrad)"
                fillOpacity={0.5}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}

            <Area
              name="Drop risk"
              type="monotone"
              dataKey="drop_risk_score"
              stroke="#b91c1c"
              strokeWidth={2.5}
              fill="url(#dropGrad)"
              fillOpacity={0.35}
              isAnimationActive={false}
            />

            {peakSec != null && (
              <ReferenceLine x={peakSec} stroke="#fbbf24" strokeDasharray="4 4" label={{ value: 'Peak', fill: '#fbbf24', fontSize: 11, position: 'top' }} />
            )}

            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12 }} />

            <Tooltip
              content={
                <CustomTooltip showHeatmap={showHeatmap} showVisual={showVisual} showTranscript={showPacing} />
              }
            />

            <Customized
              component={PinsAndMarkers}
              buckets={timeline}
              videoId={data.video_id}
              hasPins={showPins}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <Space size={18} wrap style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
        <span>
          <span style={{ color: '#b91c1c' }}>●</span> Drop risk ·{' '}
          <span style={{ color: '#0891b2' }}>●</span> Heatmap ·{' '}
          <span style={{ color: '#ec4899' }}>●</span> Visual ·{' '}
          <span style={{ color: '#22c55e' }}>●</span> Comment pin · <span style={{ color: '#fbbf24' }}>┃</span> Peak
        </span>
        <span>Pacing band: amber = slow · green = optimal · violet = fast · gray = unknown</span>
      </Space>
    </Card>
  )
}