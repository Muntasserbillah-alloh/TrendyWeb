import axios from 'axios'
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface LoginFormValues {
    email: string
    password: string
}

function resolveRedirectPath(rawRedirect: string | null): string {
    if (!rawRedirect) return '/dashboard'
    if (!rawRedirect.startsWith('/')) return '/dashboard'
    return rawRedirect
}

function resolveLoginError(error: unknown): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        if (status === 401) return 'Invalid email or password'
        if (status === 403) return 'Your account has been deactivated. Contact an admin.'
        return error.message || 'Unable to sign in right now. Please try again.'
    }

    if (error instanceof Error) return error.message
    return 'Unable to sign in right now. Please try again.'
}

export function LoginPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { login } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const redirectPath = useMemo(
        () => resolveRedirectPath(searchParams.get('redirect')),
        [searchParams]
    )

    const handleSubmit = async (values: LoginFormValues) => {
        setIsSubmitting(true)
        setErrorMessage(null)

        try {
            await login({
                email: values.email.trim(),
                password: values.password,
            })
            navigate(redirectPath, { replace: true })
        } catch (error) {
            setErrorMessage(resolveLoginError(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
            }}
        >
            <Card style={{ width: '100%', maxWidth: 420 }}>
                <Space direction="vertical" size={18} style={{ width: '100%' }}>
                    <Space direction="vertical" size={4}>
                        <Typography.Title level={3} style={{ margin: 0 }}>
                            Trendy
                        </Typography.Title>
                        <Typography.Text type="secondary">Sign in to continue</Typography.Text>
                    </Space>

                    {errorMessage && (
                        <Alert
                            type="error"
                            showIcon
                            message={errorMessage}
                        />
                    )}

                    <Form<LoginFormValues>
                        layout="vertical"
                        onFinish={handleSubmit}
                        requiredMark={false}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: 'Email is required' },
                                { type: 'email', message: 'Enter a valid email address' },
                            ]}
                        >
                            <Input placeholder="user@example.com" size="large" />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: 'Password is required' }]}
                        >
                            <Input.Password placeholder="••••••••••••" size="large" />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={isSubmitting}
                            block
                        >
                            Sign In
                        </Button>
                    </Form>
                </Space>
            </Card>
        </div>
    )
}
