import { Button, Card, Col, Row, Tooltip, Typography } from 'antd'
import { Download, ExternalLink } from 'lucide-react'
import type { VideoAnalyticsResponse } from '../../../types'
import { formatDurationHuman, formatTs, parseTimestampToSec } from './analyticsUtils'

interface CardDef {
  icon: string
  label: string
  value: string
  hint?: string
}

function buildCards(data: VideoAnalyticsResponse): CardDef[] {
  const s = data.summary_diagnostics
  const cards: CardDef[] = [
    {
      icon: '⚠️',
      label: 'Drop Zones',
      value: String(s.total_detected_drop_zones),
      hint: s.total_detected_drop_zones > 0 ? 'Flagged buckets (>65% drop risk)' : 'No flagged drop zones',
    },
  ]
  if (s.average_spoken_wpm != null)
    cards.push({ icon: '🗣️', label: 'Avg WPM', value: String(Math.round(s.average_spoken_wpm)) })
  if (s.peak_engagement_timestamp != null)
    cards.push({
      icon: '🏆',
      label: 'Peak Engagement',
      value: formatTs(parseTimestampToSec(s.peak_engagement_timestamp) ?? 0),
    })
  cards.push({ icon: '⏱️', label: 'Duration', value: formatDurationHuman(s.video_duration_sec) })
  cards.push({ icon: '📊', label: 'Buckets', value: String(s.total_buckets) })
  return cards
}

// YouTube serves images with permissive CORS, so we can fetch → blob and let the browser download
// it under a real filename. If that ever fails (CORS change, network), fall back to opening it.
async function downloadThumbnail(url: string, videoId: string) {
  try {
    const blob = await (await fetch(url)).blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `thumbnail-${videoId}.jpg`
    document.body.appendChild(a) // Firefox ignores clicks on detached anchors
    a.click()
    a.remove()
    URL.revokeObjectURL(a.href)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}

function ThumbnailBlock({ url, videoId, openUrl }: { url: string; videoId: string; openUrl: string }) {
  return (
    <div
      className="thumb-actions-wrap"
      style={{
        position: 'relative',
        width: '100%',
        height: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <img
        src={url}
        alt={`Thumbnail of video ${videoId}`}
        loading="lazy"
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
      />
      <div
        className="thumb-actions"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 8,
        }}
      >
        <Tooltip title="Download thumbnail">
          <Button
            type="primary"
            shape="circle"
            icon={<Download size={18} />}
            onClick={() => downloadThumbnail(url, videoId)}
          />
        </Tooltip>
        <Tooltip title="Open on YouTube">
          <Button
            type="primary"
            shape="circle"
            icon={<ExternalLink size={18} />}
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
          />
        </Tooltip>
      </div>
    </div>
  )
}

export function SummaryCards({ data }: { data: VideoAnalyticsResponse }) {
  const cards = buildCards(data)
  const peakSec = data.summary_diagnostics.peak_engagement_timestamp
    ? parseTimestampToSec(data.summary_diagnostics.peak_engagement_timestamp)
    : null
  const openUrl = `https://www.youtube.com/watch?v=${data.video_id}${peakSec != null ? `&t=${Math.round(peakSec)}s` : ''}`

  return (
    <Card title="Summary">
      <Row gutter={[16, 16]}>
        {data.thumbnail_url && (
          <Col xs={24} md={8}>
            <ThumbnailBlock url={data.thumbnail_url} videoId={data.video_id} openUrl={openUrl} />
          </Col>
        )}
        <Col xs={24} md={data.thumbnail_url ? 16 : 24}>
          <Row gutter={[12, 12]} align="stretch">
            {cards.map((c) => (
              <Col xs={12} md={8} key={c.label}>
                <Card size="small" style={{ height: '100%', minHeight: 104 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <span style={{ marginRight: 6 }}>{c.icon}</span>
                    {c.label}
                  </Typography.Text>
                  <Typography.Title level={4} style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {c.value}
                  </Typography.Title>
                  {c.hint && (
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {c.hint}
                    </Typography.Text>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Card>
  )
}
