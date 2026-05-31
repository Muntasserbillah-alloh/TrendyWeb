import type { ReactNode } from 'react'
import { Checkbox } from 'antd'
import { VideoCard } from '../VideoCard'
import type { Video } from '../../types'

interface SelectableVideoCardProps {
    video: Video
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    showTags?: boolean
    topRightOverlay?: ReactNode
    belowCheckboxOverlay?: ReactNode
}

export function SelectableVideoCard({
    video,
    checked,
    onCheckedChange,
    showTags = true,
    topRightOverlay,
    belowCheckboxOverlay,
}: SelectableVideoCardProps) {
    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <div style={{ position: 'absolute', left: 8, top: 8, zIndex: 3 }}>
                <Checkbox
                    checked={checked}
                    onChange={(event) => onCheckedChange(event.target.checked)}
                    onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                    }}
                    style={{
                        background: 'rgba(0, 0, 0, 0.68)',
                        borderRadius: 6,
                        padding: 4,
                    }}
                    aria-label={`Select ${video.title}`}
                />
            </div>

            {belowCheckboxOverlay && (
                <div style={{ position: 'absolute', left: 8, top: 42, zIndex: 3 }}>
                    {belowCheckboxOverlay}
                </div>
            )}

            {topRightOverlay && (
                <div style={{ position: 'absolute', right: 8, top: 8, zIndex: 3 }}>
                    {topRightOverlay}
                </div>
            )}

            <VideoCard video={video} showTags={showTags} />
        </div>
    )
}
