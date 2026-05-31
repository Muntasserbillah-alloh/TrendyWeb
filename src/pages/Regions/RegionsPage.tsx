import { useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, notification } from 'antd'
import { Edit, Plus, Trash2 } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import { useCreateRegion, useDeleteRegion, useRegions, useUpdateRegion } from '../../hooks/useRegions'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { formatDate } from '../../utils'
import type { Region } from '../../types'

interface RegionFormValues {
    name: string
    code: string
    country_codes: string
}

export function RegionsPage() {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Region | null>(null)
    const [form] = Form.useForm<RegionFormValues>()

    const { data, isLoading, error } = useRegions()
    const createMutation = useCreateRegion()
    const updateMutation = useUpdateRegion()
    const deleteMutation = useDeleteRegion()

    const regions = data?.data ?? []

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        setOpen(true)
    }

    const openEdit = (region: Region) => {
        setEditing(region)
        form.setFieldsValue({ name: region.name, code: region.code, country_codes: region.country_codes.join(', ') })
        setOpen(true)
    }

    const handleSubmit = (values: RegionFormValues) => {
        const country_codes = values.country_codes.split(',').map((s) => s.trim()).filter(Boolean)
        const onSuccess = () => { notification.success({ message: editing ? 'Region updated' : 'Region created' }); setOpen(false) }
        const onError = (err: Error) => notification.error({ message: 'Error', description: err.message })

        if (editing) {
            updateMutation.mutate({ id: editing.id, body: { name: values.name, code: values.code, country_codes } }, { onSuccess, onError })
        } else {
            createMutation.mutate({ name: values.name, code: values.code, country_codes }, { onSuccess, onError })
        }
    }

    const handleDelete = (id: number) => {
        deleteMutation.mutate(id, {
            onSuccess: () => notification.success({ message: 'Region deleted' }),
            onError: (err) => notification.error({ message: 'Error', description: (err as Error).message }),
        })
    }

    const columns: ColumnsType<Region> = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        { title: 'Code', dataIndex: 'code', key: 'code', width: 90 },
        {
            title: 'Country Codes',
            dataIndex: 'country_codes',
            key: 'country_codes',
            render: (codes: string[]) => (
                <Space wrap size={4}>{codes.map((c) => <Tag key={c}>{c}</Tag>)}</Space>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 160,
            render: (d: string) => formatDate(d),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_: unknown, record) => (
                <Space>
                    <Button size="small" icon={<Edit size={12} />} onClick={() => openEdit(record)} />
                    <Popconfirm
                        title="Delete region?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete" okType="danger"
                    >
                        <Button size="small" danger icon={<Trash2 size={12} />} loading={deleteMutation.isPending} />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography.Title level={3} style={{ margin: 0 }}>Regions</Typography.Title>
                <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>Add Region</Button>
            </div>

            {isLoading && <Spinner />}
            {error && <ErrorMessage error={error} />}

            <Table
                dataSource={regions}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 20 }}
                scroll={{ x: 600 }}
            />

            <Modal
                open={open}
                title={editing ? 'Edit Region' : 'Add Region'}
                onCancel={() => setOpen(false)}
                onOk={() => form.submit()}
                okText={editing ? 'Update' : 'Create'}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
                        <Input placeholder="e.g. United States" />
                    </Form.Item>
                    <Form.Item name="code" label="Code" rules={[{ required: true }, { max: 10 }]}>
                        <Input placeholder="e.g. US" />
                    </Form.Item>
                    <Form.Item
                        name="country_codes"
                        label="Country Codes"
                        extra="Comma-separated, e.g. US, CA, MX"
                        rules={[{ required: true, message: 'At least one country code is required' }]}
                    >
                        <Input placeholder="US, CA, MX" />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}
