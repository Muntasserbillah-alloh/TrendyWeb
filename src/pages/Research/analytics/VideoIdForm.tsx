import { useImperativeHandle, useState, type Ref } from 'react'
import { Button, Collapse, Input, Space, Typography } from 'antd'
import { AdvancedOptions } from './AdvancedOptions'
import { type AdvancedAnalyticsOptions, parseVideoId } from './analyticsUtils'

export interface VideoIdFormHandle {
  setValue: (v: string) => void
}

interface Props {
  ref?: Ref<VideoIdFormHandle>
  initialValue: string
  onSubmit: (videoId: string) => void
  isLoading: boolean
  elapsedSeconds: number
  advanced: AdvancedAnalyticsOptions
  onAdvancedChange: (v: AdvancedAnalyticsOptions) => void
  serverError?: string | null
}

// The text input is local state: typing re-renders only this form, not the page/chart. The parent
// gets the parsed id via onSubmit; initialValue is the deep-linked id. Remount via key in the
// parent whenever the analyzed id changes so the field follows the URL.
export function VideoIdForm({
  ref,
  initialValue,
  onSubmit,
  isLoading,
  elapsedSeconds,
  advanced,
  onAdvancedChange,
  serverError,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const [localError, setLocalError] = useState<string | null>(null)
  const error = localError ?? serverError ?? null

  // Lets the page pre-fill the field (example buttons) without lifting the state back up.
  useImperativeHandle(ref, () => ({ setValue }), [])

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
            setValue(e.target.value)
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