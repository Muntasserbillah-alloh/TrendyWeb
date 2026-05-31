import axios from 'axios'
import { Button, Card, Form, Input, Space, Typography, message, notification } from 'antd'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useUpdateUser } from '../../hooks/useUsers'

interface ProfileFormValues {
    email: string
    password?: string
}

function resolveUpdateError(error: unknown): string {
    if (!axios.isAxiosError(error)) {
        return error instanceof Error ? error.message : 'Failed to update your profile.'
    }

    if (error.response?.status === 409) {
        return 'This email is already in use by another account.'
    }

    if (error.response?.status === 422) {
        return error.message || 'Please check your input and try again.'
    }

    if (error.response?.status === 403) {
        return "You don't have permission to update this profile."
    }

    return error.message || 'Failed to update your profile.'
}

export function ProfilePage() {
    const [form] = Form.useForm<ProfileFormValues>()
    const { user, refreshSession } = useAuth()
    const updateUserMutation = useUpdateUser()

    useEffect(() => {
        if (!user) return
        form.setFieldValue('email', user.email)
    }, [form, user])

    const handleSubmit = async (values: ProfileFormValues) => {
        if (!user) return

        const nextEmail = values.email.trim()
        const nextPassword = values.password?.trim()

        const payload: { email?: string; password?: string } = {}
        if (nextEmail && nextEmail !== user.email) {
            payload.email = nextEmail
        }
        if (nextPassword) {
            payload.password = nextPassword
        }

        if (!payload.email && !payload.password) {
            void message.info('No changes to save.')
            return
        }

        updateUserMutation.mutate(
            {
                id: user.id,
                payload,
            },
            {
                onSuccess: async (response) => {
                    form.setFieldValue('email', response.data.email)
                    form.resetFields(['password'])

                    try {
                        await refreshSession()
                    } catch {
                        // Session refresh can fail independently; profile update still succeeded.
                    }

                    void notification.success({
                        message: 'Profile updated',
                        description: 'Your changes were saved successfully.',
                    })
                },
                onError: (error) => {
                    void notification.error({
                        message: 'Failed to update profile',
                        description: resolveUpdateError(error),
                    })
                },
            }
        )
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={3} style={{ margin: 0 }}>
                My Profile
            </Typography.Title>
            <Typography.Text type="secondary">
                Update your email and password.
            </Typography.Text>

            <Card style={{ maxWidth: 680 }}>
                <Form<ProfileFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    onFinish={(values) => {
                        void handleSubmit(values)
                    }}
                >
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Email is required.' },
                            { type: 'email', message: 'Please enter a valid email address.' },
                        ]}
                    >
                        <Input placeholder="user@example.com" />
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
                        <Input.Password placeholder="Enter a new password" />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" loading={updateUserMutation.isPending}>
                        Save Changes
                    </Button>
                </Form>
            </Card>
        </Space>
    )
}
