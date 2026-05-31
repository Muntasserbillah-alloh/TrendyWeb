import { Tag } from 'antd'
import { platformColor, platformLabel } from '../utils'
import type { Trend } from '../types'

interface PlatformBadgeProps {
    platform: Trend['platform']
}

export function PlatformBadge({ platform }: PlatformBadgeProps) {
    return <Tag color={platformColor(platform)}>{platformLabel(platform)}</Tag>
}
