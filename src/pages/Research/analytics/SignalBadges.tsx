import { Space, Tag, Tooltip } from 'antd'
import type { VideoAnalyticsSignals } from '../../../types'
import { signalTooltip } from './analyticsUtils'

const ORDER: Array<{ key: keyof VideoAnalyticsSignals; label: string; icon: string }> = [
  { key: 'heatmap', label: 'Heatmap', icon: '🌡️' },
  { key: 'transcript', label: 'Transcript', icon: '📝' },
  { key: 'comments', label: 'Comments', icon: '💬' },
  { key: 'visual', label: 'Visual', icon: '🎬' },
]

function Badge({ entry, value }: { entry: (typeof ORDER)[number]; value: string }) {
  const ok = value === 'OK'
  const tip = `${entry.label}: ${signalTooltip(entry.key, value)}`
  return (
    <Tooltip title={tip} placement="bottom">
      <Tag color={ok ? 'green' : 'default'} style={{ margin: 0 }}>
        <span style={{ marginRight: 6 }}>{entry.icon}</span>
        <span style={{ fontWeight: ok ? 600 : 500 }}>{entry.label}</span>
        {!ok && (
          <span style={{ marginLeft: 6, color: '#6b7280', fontSize: 12 }}>
            {value.replace(/_/g, ' ').toLowerCase()}
          </span>
        )}
      </Tag>
    </Tooltip>
  )
}

export function SignalBadges({ signals }: { signals: VideoAnalyticsSignals }) {
  return (
    <Space size={8} wrap>
      {ORDER.map((entry) => (
        <Badge key={entry.key} entry={entry} value={signals[entry.key]} />
      ))}
    </Space>
  )
}