import { useEffect, useState } from 'react'
import { Alert, Button, Input, Modal, Radio, Select, Space, Tag, Typography } from 'antd'
import { useYoutubeCollections } from '../../hooks/useYoutube'
import type { YoutubeCollectionSource } from '../../types'

const { TextArea } = Input

type SaveMode = 'new' | 'existing'

interface YoutubeSaveCollectionModalProps {
    open: boolean
    isSaving: boolean
    selectedCount: number
    defaultName: string
    source: YoutubeCollectionSource
    topic?: string
    regionCode?: string
    categoryId?: number
    videoTypeFilter?: 'all' | 'shorts' | 'normal'
    preferredCollectionId?: number
    onCancel: () => void
    onSubmit: (payload: {
        mode: SaveMode
        name: string
        description?: string
        collectionId?: number
    }) => void
}

export function YoutubeSaveCollectionModal({
    open,
    isSaving,
    selectedCount,
    defaultName,
    source,
    topic,
    regionCode,
    categoryId,
    videoTypeFilter,
    preferredCollectionId,
    onCancel,
    onSubmit,
}: YoutubeSaveCollectionModalProps) {
    const {
        data: collectionsResponse,
        isLoading: isCollectionsLoading,
        refetch: refetchCollections,
    } = useYoutubeCollections(
        {},
        { enabled: open }
    )

    const collections = collectionsResponse?.data ?? []
    const [mode, setMode] = useState<SaveMode>('new')
    const [name, setName] = useState(defaultName)
    const [description, setDescription] = useState('')
    const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>()

    useEffect(() => {
        if (!open) return

        void refetchCollections()

        const hasPreferredCollection = typeof preferredCollectionId === 'number'

        setMode(hasPreferredCollection ? 'existing' : 'new')
        setName(defaultName)
        setDescription('')
        setSelectedCollectionId(preferredCollectionId)
    }, [defaultName, open, preferredCollectionId, refetchCollections])

    const trimmedName = name.trim()
    const selectedCollection = collections.find((collection) => collection.id === selectedCollectionId)

    const nameError =
        trimmedName.length === 0
            ? 'Collection name is required.'
            : trimmedName.length > 300
                ? 'Collection name must be 300 characters or less.'
                : null

    const existingCollectionError =
        mode === 'existing' && typeof selectedCollectionId !== 'number'
            ? 'Please select a collection.'
            : null

    const handleSubmit = () => {
        if (mode === 'existing') {
            if (typeof selectedCollectionId !== 'number') return
            onSubmit({
                mode,
                collectionId: selectedCollectionId,
                name: selectedCollection?.name || trimmedName || defaultName,
            })
            return
        }

        if (nameError) return
        onSubmit({
            mode,
            name: trimmedName,
            description: description.trim() || undefined,
        })
    }

    const isSubmitDisabled =
        selectedCount < 1 || (mode === 'new' ? !!nameError : !!existingCollectionError)

    return (
        <Modal
            open={open}
            title={`Save ${selectedCount} video${selectedCount === 1 ? '' : 's'} to collection`}
            okText="Save Collection"
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={isSaving}
            okButtonProps={{ disabled: isSubmitDisabled }}
            destroyOnClose
        >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <Radio.Group
                    value={mode}
                    onChange={(event) => setMode(event.target.value as SaveMode)}
                    optionType="button"
                    buttonStyle="solid"
                >
                    <Radio.Button value="new">New collection</Radio.Button>
                    <Radio.Button value="existing">Add to existing collection</Radio.Button>
                </Radio.Group>

                {mode === 'new' ? (
                    <>
                        <div>
                            <Typography.Text type="secondary">Collection name</Typography.Text>
                            <Input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={300}
                                status={nameError ? 'error' : ''}
                                placeholder="Gaming Outliers May 2026"
                            />
                            {nameError && (
                                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                                    {nameError}
                                </Typography.Text>
                            )}
                        </div>

                        <div>
                            <Typography.Text type="secondary">Description (optional)</Typography.Text>
                            <TextArea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                maxLength={500}
                                autoSize={{ minRows: 3, maxRows: 5 }}
                                placeholder="Top opportunities from this run"
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <Typography.Text type="secondary">Collection</Typography.Text>
                        <Select
                            showSearch
                            style={{ width: '100%' }}
                            value={selectedCollectionId}
                            loading={isCollectionsLoading}
                            placeholder="Select a collection"
                            optionFilterProp="label"
                            onChange={(value) => setSelectedCollectionId(value)}
                            options={collections.map((collection) => ({
                                value: collection.id,
                                label: `${collection.name} (${collection.video_count} videos)`,
                            }))}
                        />

                        {existingCollectionError && (
                            <Typography.Text type="danger" style={{ fontSize: 12 }}>
                                {existingCollectionError}
                            </Typography.Text>
                        )}

                        {collections.length === 0 && !isCollectionsLoading && (
                            <Alert
                                type="info"
                                showIcon
                                style={{ marginTop: 8 }}
                                message="No collections yet"
                                description={
                                    <Space direction="vertical" size={8}>
                                        <Typography.Text type="secondary">
                                            Create your first collection, then you can append videos here.
                                        </Typography.Text>
                                        <Button size="small" onClick={() => setMode('new')}>
                                            Switch to New collection
                                        </Button>
                                    </Space>
                                }
                            />
                        )}
                    </div>
                )}

                <Space size={[8, 8]} wrap>
                    <Tag color="blue">Source: {source}</Tag>
                    {topic && <Tag color="purple">Topic: {topic}</Tag>}
                    {regionCode && <Tag color="geekblue">Region: {regionCode}</Tag>}
                    {typeof categoryId === 'number' && <Tag>Category: {categoryId}</Tag>}
                    {videoTypeFilter && <Tag color="cyan">Type: {videoTypeFilter}</Tag>}
                </Space>
            </Space>
        </Modal>
    )
}
