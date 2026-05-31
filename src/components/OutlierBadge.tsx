import { Tag } from 'antd'
import { outlierScoreColor, outlierScoreLabel } from '../utils'

interface OutlierBadgeProps {
    score: number | null
    isOutlier: boolean
}

export function OutlierBadge({ score, isOutlier }: OutlierBadgeProps) {
    const color = outlierScoreColor(score)
    const label = outlierScoreLabel(score)
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {isOutlier && <span title="Outlier signal">🔥</span>}
            {score != null && <Tag color={color}>{label}</Tag>}
        </span>
    )
}
