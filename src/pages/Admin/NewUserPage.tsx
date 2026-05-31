import axios from 'axios'
import {
    Button,
    Card,
    Form,
    Input,
    Radio,
    Space,
    Typography,
    message,
    notification,
} from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import type { UserRole } from '../../types'

interface RegisterFormValues {
    email: string
    password: string
    role: UserRole
}

function generateStrongPassword(length = 16): string {
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()_+-='
    let result = ''

    for (let index = 0; index < length; index += 1) {
        const randomIndex = Math.floor(Math.random() * charset.length)
        result += charset[randomIndex]
    }

    return result
}

export function NewUserPage() {
    const [form] = Form.useForm<RegisterFormValues>()
    const navigate = useNavigate()
    const { registerUser, logout } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleGeneratePassword = async () => {
        const nextPassword = generateStrongPassword()
        form.setFieldValue('password', nextPassword)

        try {
            await navigator.clipboard.writeText(nextPassword)
            void message.success('Generated password copied to clipboard')
        } catch {
            void message.info('Password generated')
        }
    }

    const handleSubmit = async (values: RegisterFormValues) => {
        setIsSubmitting(true)

        try {
            const createdUser = await registerUser({
                email: values.email.trim(),
                password: values.password,
                role: values.role,
            })

            void notification.success({
                message: 'User created',
                description: `${createdUser.email} was created as ${createdUser.role}.`,
            })

            form.resetFields()
            form.setFieldValue('role', 'viewer')
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status

                if (status === 409) {
                    form.setFields([{ name: 'email', errors: ['This email is already registered.'] }])
                    return
                }

                if (status === 403) {
                    logout()
                    navigate('/login?redirect=%2Fadmin%2Fusers%2Fnew', { replace: true })
                    return
                }

                void notification.error({
                    message: 'Failed to create user',
                    description: error.message || 'Please try again.',
                })
                return
            }

            void notification.error({
                message: 'Failed to create user',
                description: error instanceof Error ? error.message : 'Please try again.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Title level={3} style={{ margin: 0 }}>
                New User
            </Typography.Title>
            <Typography.Text type="secondary">
                Create a new account and share credentials securely with the user.
            </Typography.Text>

            <Card style={{ maxWidth: 620 }}>
                <Form<RegisterFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    initialValues={{ role: 'viewer' }}
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Email is required' },
                            { type: 'email', message: 'Enter a valid email address' },
                        ]}
                    >
                        <Input placeholder="newuser@example.com" />
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                            { required: true, message: 'Password is required' },
                            { min: 8, message: 'Password must be at least 8 characters' },
                        ]}
                    >
                        <Input.Password placeholder="Set or generate a secure password" />
                    </Form.Item>

                    <Button onClick={() => void handleGeneratePassword()} style={{ marginBottom: 16 }}>
                        Generate Password
                    </Button>

                    <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Role is required' }]}>
                        <Radio.Group>
                            <Space direction="vertical">
                                <Radio value="viewer">Viewer</Radio>
                                <Radio value="editor">Editor</Radio>
                                <Radio value="admin">Admin</Radio>
                            </Space>
                        </Radio.Group>
                    </Form.Item>

                    <Space>
                        <Button onClick={() => navigate(-1)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={isSubmitting}>
                            Create User
                        </Button>
                    </Space>
                </Form>
            </Card>
        </Space>
    )
}
