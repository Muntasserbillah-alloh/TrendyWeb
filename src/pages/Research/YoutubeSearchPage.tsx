import { useMemo, useState } from 'react'
import { Tabs } from 'antd'
import { SearchTab } from './SearchTab'
import { TrendingVideosTab } from './TrendingVideosTab'

export function YoutubeSearchPage() {
    const [activeTab, setActiveTab] = useState('search')

    const tabItems = useMemo(
        () => [
            { key: 'search', label: 'Search', children: <SearchTab /> },
            { key: 'trending-videos', label: 'Trending Videos', children: <TrendingVideosTab /> },
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
