import { useMemo, useState } from 'react'
import { Tabs } from 'antd'
import { TopicAnalysisTab } from './TopicAnalysisTab'
import { VideoIdeasTab } from './VideoIdeasTab'
import { OutliersTab } from './OutliersTab'
import { HashtagsTab } from './HashtagsTab'
import { ChannelTab } from './ChannelTab'

export function YoutubeAnalyticsPage() {
    const [activeTab, setActiveTab] = useState('analysis')

    const tabItems = useMemo(
        () => [
            { key: 'analysis', label: 'Topic Analysis', children: <TopicAnalysisTab /> },
            { key: 'ideas', label: 'Video Ideas', children: <VideoIdeasTab /> },
            { key: 'outliers', label: 'Outliers', children: <OutliersTab /> },
            { key: 'hashtags', label: 'Hashtags', children: <HashtagsTab /> },
            { key: 'channel', label: 'Channel', children: <ChannelTab /> },
        ],
        []
    )

    return (
        <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            items={tabItems}
            style={{ width: '100%' }}
        />
    )
}
