import { Button, Descriptions, Drawer, Space, Tag } from 'antd'
import { ExternalLink } from 'lucide-react'
import type { VideoAnalyticsBucket } from '../../../types'
import {
  PACING_COLORS,
  PACING_LABELS,
  formatTs,
  pct,
  siteCommentUrl,
} from './analyticsUtils'

interface Props {
  open: boolean
  bucket: VideoAnalyticsBucket | null
  videoId: string | null
  onClose: () => void
}

export function BucketDetailDrawer({ open, bucket, videoId, onClose }: Props) {
  if (!bucket) {
    return <Drawer open={open} onClose={onClose} width={420} />
  }
  const videoIdSafe = videoId ?? ''
  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={420}
      title={
        <Space size={8} align="center">
          <span>Bucket detail</span>
          <Tag style={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {formatTs(bucket.timestamp_start)}–{formatTs(bucket.timestamp_end)}
          </Tag>
          {bucket.flag_alert && <Tag color="red" style={{ margin: 0 }}>⚠ drop zone</Tag>}
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions column={1} size="small" bordered labelStyle={{ width: 150 }}>
          <Descriptions.Item label="Drop risk score">
            <span style={{ fontWeight: 600, color: '#b91c1c', fontVariantNumeric: 'tabular-nums' }}>
              {pct(bucket.drop_risk_score)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Flag alert">
            {bucket.flag_alert ? '⚠ flagged (>65%)' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Heatmap score">{pct(bucket.heatmap_score)}</Descriptions.Item>
          <Descriptions.Item label="Words / minute">
            {bucket.wpm == null ? '—' : Math.round(bucket.wpm)}
          </Descriptions.Item>
          <Descriptions.Item label="Pacing">
            <Tag color="default" style={{ color: PACING_COLORS[bucket.pacing_status] }}>
              {PACING_LABELS[bucket.pacing_status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Comment mentions">{bucket.comment_mentions}</Descriptions.Item>
          <Descriptions.Item label="Visual change">{pct(bucket.visual_change_score)}</Descriptions.Item>
        </Descriptions>

        {bucket.comment_mentions > 0 && (
          <Button
            type="default"
            icon={<ExternalLink size={14} />}
            href={siteCommentUrl(videoIdSafe, bucket.timestamp_start)}
            target="_blank"
            block
          >
            Open comments at {formatTs(bucket.timestamp_start)} on YouTube
          </Button>
        )}
      </Space>
    </Drawer>
  )
}