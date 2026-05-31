import { Button, Card, Space, Typography } from 'antd'

interface YoutubeSelectionToolbarProps {
    totalCount: number
    selectedCount: number
    outliersCount: number
    onSelectAll: () => void
    onDeselectAll: () => void
    onSelectOutliersOnly: () => void
    onInvertSelection: () => void
    onSaveSelected: () => void
    saveDisabled: boolean
    isSaving?: boolean
}

export function YoutubeSelectionToolbar({
    totalCount,
    selectedCount,
    outliersCount,
    onSelectAll,
    onDeselectAll,
    onSelectOutliersOnly,
    onInvertSelection,
    onSaveSelected,
    saveDisabled,
    isSaving = false,
}: YoutubeSelectionToolbarProps) {
    return (
        <Card size="small">
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Typography.Text>
                        <Typography.Text strong>{selectedCount}</Typography.Text> of {totalCount} selected
                    </Typography.Text>
                    <Button type="primary" onClick={onSaveSelected} disabled={saveDisabled} loading={isSaving}>
                        Save Selected
                    </Button>
                </Space>

                <Space wrap>
                    <Button onClick={onSelectAll}>Select All</Button>
                    <Button onClick={onDeselectAll}>Deselect All</Button>
                    <Button onClick={onSelectOutliersOnly}>Select Outliers Only ({outliersCount})</Button>
                    <Button onClick={onInvertSelection}>Invert Selection</Button>
                </Space>
            </Space>
        </Card>
    )
}
