import { Space, Tabs, Typography } from 'antd'
import { OpportunityTab } from './OpportunityTab'
import { SaturationTab } from './SaturationTab'
import { RelatedTopicsTab } from './RelatedTopicsTab'
import { CalendarTab } from './CalendarTab'
import { ClassificationTab } from './ClassificationTab'
import { ExploreTab } from './ExploreTab'

const TAB_ITEMS = [
    { key: 'explore', label: '🧠 Explore Ideas', children: <ExploreTab /> },
    { key: 'opportunity', label: '🎯 Opportunity Analyzer', children: <OpportunityTab /> },
    { key: 'saturation', label: '📊 Niche Saturation', children: <SaturationTab /> },
    { key: 'related', label: '🔗 Related Topics', children: <RelatedTopicsTab /> },
    { key: 'calendar', label: '📅 Content Calendar', children: <CalendarTab /> },
    { key: 'classification', label: '🏷️ Trend Classification', children: <ClassificationTab /> },
]

export function PlannerPage() {
    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={3} style={{ margin: 0 }}>Content Planner</Typography.Title>
            <Tabs items={TAB_ITEMS} defaultActiveKey="opportunity" size="large" />
        </Space>
    )
}
