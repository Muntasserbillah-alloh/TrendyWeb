import { Card, Col, Row, Typography } from 'antd'
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

export function SummaryCards({ data }: { data: VideoAnalyticsResponse }) {
  const cards = buildCards(data)
  return (
    <Row gutter={[12, 12]}>
      {cards.map((c) => (
        <Col xs={12} md={Math.floor(24 / cards.length)} key={c.label}>
          <Card size="small" style={{ height: '100%' }}>
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
  )
}