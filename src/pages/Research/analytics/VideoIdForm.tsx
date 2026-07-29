import { useState } from 'react'
import { Button, Collapse, Input, Space, Typography } from 'antd'
import { AdvancedOptions } from './AdvancedOptions'
import { type AdvancedAnalyticsOptions, parseVideoId } from './analyticsUtils'

interface Props {
  value: string
  onChange: (v: string) => void
  onSubmit: (videoId: string) => void
  isLoading: boolean
  elapsedSeconds: number
  advanced: AdvancedAnalyticsOptions
  onAdvancedChange: (v: AdvancedAnalyticsOptions) => void
  serverError?: string | null
}

export function VideoIdForm({
  value,
  onChange,
  onSubmit,
  isLoading,
  elapsedSeconds,
  advanced,
  onAdvancedChange,
  serverError,
}: Props) {
  const [localError, setLocalError] = useState<string | null>(null)
  const error = localError ?? serverError ?? null

  function handleAnalyze() {
    const id = parseVideoId(value)
    if (!id) {
      setLocalError('Enter a valid YouTube video URL or 11-character video ID.')
      return
    }
    setLocalError(null)
    onSubmit(id)
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <Input
          size="large"
          placeholder="Paste a YouTube URL or video ID (e.g. dQw4w9WgXcQ)"
          value={value}
          onChange={(e) => {
            setLocalError(null)
            onChange(e.target.value)
          }}
          onPressEnter={handleAnalyze}
          status={error ? 'error' : undefined}
          allowClear
          disabled={isLoading}
          style={{ flex: 1 }}
        />
        <Button
          size="large"
          type="primary"
          loading={isLoading}
          onClick={handleAnalyze}
          style={{ minWidth: 160 }}
        >
          {isLoading ? `Analyzing… ${elapsedSeconds}s` : 'Analyze'}
        </Button>
      </div>

      {error && (
        <Typography.Text type="danger" style={{ fontSize: 13 }}>
          {error}
        </Typography.Text>
      )}

      <Collapse
        ghost
        items={[
          {
            key: 'adv',
            label: 'Advanced options',
            children: <AdvancedOptions value={advanced} onChange={onAdvancedChange} />,
          },
        ]}
      />
    </Space>
  )
}