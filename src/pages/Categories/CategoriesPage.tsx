import { useState } from 'react'
import { Button, Form, Input, Modal, Popconfirm, Space, Table, Typography, notification } from 'antd'
import { Edit, Plus, Trash2 } from 'lucide-react'
import type { ColumnsType } from 'antd/es/table'
import {
    useCategories,
    useCreateCategory,
    useDeleteCategory,
    useUpdateCategory,
} from '../../hooks/useCategories'
import { Spinner } from '../../components/Spinner'
import { ErrorMessage } from '../../components/ErrorMessage'
import { formatDate } from '../../utils'
import type { Category } from '../../types'

interface CategoryFormValues {
    name: string
    description: string
}

export function CategoriesPage() {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Category | null>(null)
    const [form] = Form.useForm<CategoryFormValues>()

    const { data, isLoading, error } = useCategories()
    const createMutation = useCreateCategory()
    const updateMutation = useUpdateCategory()
    const deleteMutation = useDeleteCategory()

    const categories = data?.data ?? []

    const openCreate = () => {
        setEditing(null)
        form.resetFields()
        setOpen(true)
    }

    const openEdit = (cat: Category) => {
        setEditing(cat)
        form.setFieldsValue({ name: cat.name, description: cat.description ?? '' })
        setOpen(true)
    }

    const handleSubmit = (values: CategoryFormValues) => {
        const onSuccess = () => {
            notification.success({ message: editing ? 'Category updated' : 'Category created' })
            setOpen(false)
        }
        const onError = (err: Error) =>
            notification.error({ message: 'Error', description: err.message })

        if (editing) {
            updateMutation.mutate(
                { id: editing.id, body: { name: values.name, description: values.description } },
                { onSuccess, onError }
            )
        } else {
            createMutation.mutate(
                { name: values.name, description: values.description || undefined },
                { onSuccess, onError }
            )
        }
    }

    const handleDelete = (id: number) => {
        deleteMutation.mutate(id, {
            onSuccess: () => notification.success({ message: 'Category deleted' }),
            onError: (err) =>
                notification.error({ message: 'Error', description: (err as Error).message }),
        })
    }

    const columns: ColumnsType<Category> = [
        { title: 'Name', dataIndex: 'name', key: 'name' },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            render: (d: string | null) =>
                d ?? <Typography.Text type="secondary">—</Typography.Text>,
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
                        title="Delete category?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Delete"
                        okType="danger"
                    >
                        <Button
                            size="small"
                            danger
                            icon={<Trash2 size={12} />}
                            loading={deleteMutation.isPending}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography.Title level={3} style={{ margin: 0 }}>Categories</Typography.Title>
                <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>
                    Add Category
                </Button>
            </div>

            {isLoading && <Spinner />}
            {error && <ErrorMessage error={error} />}

            <Table
                dataSource={categories}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 20 }}
            />

            <Modal
                open={open}
                title={editing ? 'Edit Category' : 'Add Category'}
                onCancel={() => setOpen(false)}
                onOk={() => form.submit()}
                okText={editing ? 'Update' : 'Create'}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Name is required' }]}
                    >
                        <Input placeholder="e.g. Technology" />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} placeholder="Optional description..." />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}
