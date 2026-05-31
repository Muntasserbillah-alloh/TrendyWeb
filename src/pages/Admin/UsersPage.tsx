import axios from 'axios'
import {
    Button,
    Card,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Typography,
    notification,
} from 'antd'
import { Edit, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { ErrorMessage } from '../../components/ErrorMessage'
import { Spinner } from '../../components/Spinner'
import { useUpdateUser, useUsers } from '../../hooks/useUsers'
import { formatDate } from '../../utils'
import type { ManagedAuthUser, UserRole } from '../../types'

interface EditUserFormValues {
    email: string
    password?: string
    role: UserRole
    is_active: boolean
}

function resolveUpdateError(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error ? error.message : 'Failed to update user.'
    }

    if (error.response?.status === 409) {
        return 'That email is already used by another account.'
    }

    if (error.response?.status === 404) {
        return 'User not found.'
    }

    if (error.response?.status === 422) {
        return error.message || 'Validation failed. Please check your input.'
    }

    return error.message || 'Failed to update user.'
}

export function UsersPage() {
    const [form] = Form.useForm<EditUserFormValues>()
    const navigate = useNavigate()
    const { data, isLoading, error, refetch } = useUsers()
    const updateUserMutation = useUpdateUser()

    const [editingUser, setEditingUser] = useState<ManagedAuthUser | null>(null)

    const users = data?.data ?? []

    const openEditModal = (user: ManagedAuthUser) => {
        setEditingUser(user)
        form.setFieldsValue({
            email: user.email,
            password: '',
            role: user.role,
            is_active: user.is_active,
        })
    }

    const closeEditModal = () => {
        setEditingUser(null)
        form.resetFields()
    }

    const handleSubmit = (values: EditUserFormValues) => {
        if (!editingUser) return

        const payload: {
            email?: string
            password?: string
            role?: UserRole
            is_active?: boolean
        } = {}

        const nextEmail = values.email.trim()
        const nextPassword = values.password?.trim()

        if (nextEmail && nextEmail !== editingUser.email) {
            payload.email = nextEmail
        }

        if (nextPassword) {
            payload.password = nextPassword
        }

        if (values.role !== editingUser.role) {
            payload.role = values.role
        }

        if (values.is_active !== editingUser.is_active) {
            payload.is_active = values.is_active
        }

        if (Object.keys(payload).length === 0) {
            void notification.info({
                message: 'No changes',
                description: 'Nothing to update for this user.',
            })
            return
        }

        updateUserMutation.mutate(
            {
                id: editingUser.id,
                payload,
            },
            {
                onSuccess: (response) => {
                    void notification.success({
                        message: 'User updated',
                        description: `${response.data.email} was updated successfully.`,
                    })
                    closeEditModal()
                },
                onError: (mutationError) => {
                    void notification.error({
                        message: 'Failed to update user',
                        description: resolveUpdateError(mutationError),
                    })
                },
            }
        )
    }

    const columns: ColumnsType<ManagedAuthUser> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            width: 130,
            render: (role: UserRole) => {
                const color = role === 'admin' ? 'red' : role === 'editor' ? 'gold' : 'default'
                return <Tag color={color}>{role}</Tag>
            },
        },
        {
            title: 'Active',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 120,
            render: (isActive: boolean) =>
                isActive ? <Tag color="green">Active</Tag> : <Tag color="default">Inactive</Tag>,
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            render: (createdAt: string) => formatDate(createdAt),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 110,
            render: (_, user) => (
                <Button icon={<Edit size={14} />} onClick={() => openEditModal(user)}>
                    Edit
                </Button>
            ),
        },
    ]

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space style={{ justifyContent: 'space-between', width: '100%' }} wrap>
                <Space direction="vertical" size={4}>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        Users
                    </Typography.Title>
                    <Typography.Text type="secondary">
                        Manage user accounts, roles, and activation state.
                    </Typography.Text>
                </Space>

                <Button type="primary" icon={<Plus size={14} />} onClick={() => navigate('/admin/users/new')}>
                    Create User
                </Button>
            </Space>

            {isLoading && <Spinner tip="Loading users..." />}

            {error && (
                <ErrorMessage
                    error={error}
                    message="Failed to load users."
                    onRetry={() => void refetch()}
                />
            )}

            {!error && (
                <Card>
                    <Table
                        dataSource={users}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{ pageSize: 20, showSizeChanger: false }}
                    />
                </Card>
            )}

            <Modal
                open={!!editingUser}
                title={editingUser ? `Edit User #${editingUser.id}` : 'Edit User'}
                onCancel={closeEditModal}
                onOk={() => form.submit()}
                okText="Save"
                confirmLoading={updateUserMutation.isPending}
                destroyOnClose
            >
                <Form<EditUserFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={handleSubmit}
                    style={{ marginTop: 12 }}
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Email is required.' },
                            { type: 'email', message: 'Please enter a valid email address.' },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="New Password (leave blank to keep current password)"
                        rules={[
                            {
                                validator: (_, value: string | undefined) => {
                                    if (!value || value.trim().length === 0) {
                                        return Promise.resolve()
                                    }

                                    if (value.trim().length < 8) {
                                        return Promise.reject(new Error('Password must be at least 8 characters long.'))
                                    }

                                    return Promise.resolve()
                                },
                            },
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Role is required.' }]}
                    >
                        <Select
                            options={[
                                { label: 'Viewer', value: 'viewer' },
                                { label: 'Editor', value: 'editor' },
                                { label: 'Admin', value: 'admin' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="is_active"
                        label="Active"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}
