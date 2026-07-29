import { Input, InputNumber, Select, Space, Typography } from 'antd'
import type { AdvancedAnalyticsOptions } from './analyticsUtils'

const BUCKET_SIZES = [5, 10, 15, 30, 60]

interface Props {
  value: AdvancedAnalyticsOptions
  onChange: (v: AdvancedAnalyticsOptions) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
        {label}
      </Typography.Text>
      {children}
    </div>
  )
}

export function AdvancedOptions({ value, onChange }: Props) {
  return (
    <Space size="middle" wrap align="end">
      <Field label="Bucket size (s)">
        <Select
          style={{ width: 100 }}
          value={value.bucket_size_sec}
          onChange={(v) => onChange({ ...value, bucket_size_sec: v })}
          options={BUCKET_SIZES.map((b) => ({ value: b, label: `${b}s` }))}
        />
      </Field>
      <Field label="Languages (comma-separated)">
        <Input
          style={{ width: 200 }}
          value={value.languages}
          onChange={(e) => onChange({ ...value, languages: e.target.value })}
          placeholder="en,ar"
        />
      </Field>
      <Field label="Comment pages (0-20)">
        <InputNumber
          style={{ width: 150 }}
          min={0}
          max={20}
          value={value.max_comment_pages}
          onChange={(v) =>
            onChange({ ...value, max_comment_pages: typeof v === 'number' ? v : value.max_comment_pages })
          }
        />
      </Field>
    </Space>
  )
}