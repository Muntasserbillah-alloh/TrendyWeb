import { useMemo, useState } from 'react'
import { Button, ConfigProvider, Layout, Menu, Space, Typography, theme as antdTheme } from 'antd'
import type { MenuProps } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    Activity,
    BarChart2,
    Calendar,
    Flame,
    Globe,
    Moon,
    Shield,
    Sun,
    Tag as TagIcon,
    User,
    Users,
    Video,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const { Sider, Header, Content } = Layout

const HEADER_HEIGHT = 64
const SIDER_TRIGGER_HEIGHT = 48

const BASE_NAV_ITEMS: NonNullable<MenuProps['items']> = [
    { key: '/dashboard', icon: <BarChart2 size={16} />, label: 'Dashboard' },
    {
        key: '/trends',
        icon: <Flame size={16} />,
        label: 'Trend Intelligence',
        children: [
            { key: '/trends/explore', label: 'Trend Discovery' },
            { key: '/trends/saved', label: 'Saved Library' },
        ],
    },
    {
        key: '/youtube',
        icon: <Video size={16} />,
        label: 'YouTube Research',
        children: [
            { key: '/youtube/search', label: 'Search' },
            { key: '/youtube/trending-videos', label: 'Trending Videos' },
            { key: '/youtube/outliers', label: 'Outliers' },
            { key: '/youtube/analysis', label: 'Analysis' },
            { key: '/youtube/ideas', label: 'Ideas' },
            { key: '/youtube/trending', label: 'Trending Topics' },
            { key: '/youtube/hashtags', label: 'Hashtags' },
            { key: '/youtube/channel', label: 'Channel' },
            { key: '/youtube/collections', label: 'Collections' },
        ],
    },
    { key: '/planner', icon: <Calendar size={16} />, label: 'Content Planner' },
    { key: '/creator', icon: <Users size={16} />, label: 'Creator Recs' },
    { key: '/velocity', icon: <Activity size={16} />, label: 'Velocity Monitor' },
    { key: '/profile', icon: <User size={16} />, label: 'Profile' },
    { key: '/regions', icon: <Globe size={16} />, label: 'Regions' },
    { key: '/categories', icon: <TagIcon size={16} />, label: 'Categories' },
]

function buildNavItems(isAdmin: boolean): NonNullable<MenuProps['items']> {
    if (!isAdmin) return BASE_NAV_ITEMS

    return [
        ...BASE_NAV_ITEMS,
        {
            key: '/admin',
            icon: <Shield size={16} />,
            label: 'Admin',
            children: [
                { key: '/admin/users', label: 'Users' },
                { key: '/admin/users/new', label: 'Create User' },
            ],
        },
    ]
}

function resolveSelectedKey(pathname: string): string {
    if (pathname === '/' || pathname.startsWith('/dashboard')) return '/dashboard'
    if (pathname.startsWith('/admin/users/new')) return '/admin/users/new'
    if (pathname.startsWith('/admin/users')) return '/admin/users'
    if (pathname.startsWith('/admin')) return '/admin/users'
    if (pathname.startsWith('/trends/saved')) return '/trends/saved'
    if (pathname.startsWith('/trends')) return '/trends/explore'
    if (pathname.startsWith('/planner')) return '/planner'
    if (pathname.startsWith('/creator')) return '/creator'
    if (pathname.startsWith('/velocity')) return '/velocity'
    if (pathname.startsWith('/profile')) return '/profile'
    if (pathname.startsWith('/youtube/trending-videos')) return '/youtube/trending-videos'
    if (pathname.startsWith('/youtube/outliers')) return '/youtube/outliers'
    if (pathname.startsWith('/youtube/analysis')) return '/youtube/analysis'
    if (pathname.startsWith('/youtube/ideas')) return '/youtube/ideas'
    if (pathname.startsWith('/youtube/trending')) return '/youtube/trending'
    if (pathname.startsWith('/youtube/hashtags')) return '/youtube/hashtags'
    if (pathname.startsWith('/youtube/channel')) return '/youtube/channel'
    if (pathname.startsWith('/youtube/collections')) return '/youtube/collections'
    if (pathname.startsWith('/youtube/analytics')) return '/youtube/analysis'
    if (pathname.startsWith('/youtube')) return '/youtube/search'
    if (pathname.startsWith('/research')) return '/youtube/search'
    if (pathname.startsWith('/regions')) return '/regions'
    if (pathname.startsWith('/categories')) return '/categories'
    return '/dashboard'
}

export function AppLayout() {
    const [collapsed, setCollapsed] = useState(false)
    const [dark, setDark] = useState(true)

    const appTheme = useMemo(
        () => ({
            algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            components: dark
                ? {
                    Layout: {
                        siderBg: '#141414',
                        headerBg: '#141414',
                        triggerBg: '#141414',
                        triggerColor: 'rgba(255,255,255,0.9)',
                    },
                    Menu: {
                        darkItemBg: '#141414',
                        darkSubMenuItemBg: '#141414',
                        darkPopupBg: '#141414',
                        darkItemSelectedBg: '#1f4fff',
                        darkItemHoverBg: 'rgba(255,255,255,0.08)',
                    },
                }
                : undefined,
        }),
        [dark]
    )

    return (
        <ConfigProvider theme={appTheme}>
            <LayoutShell collapsed={collapsed} setCollapsed={setCollapsed} dark={dark} setDark={setDark} />
        </ConfigProvider>
    )
}

interface ShellProps {
    collapsed: boolean
    setCollapsed: (v: boolean) => void
    dark: boolean
    setDark: (v: boolean) => void
}

function LayoutShell({ collapsed, setCollapsed, dark, setDark }: ShellProps) {
    const { token } = antdTheme.useToken()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout, isAdmin } = useAuth()
    const navItems = useMemo(() => buildNavItems(isAdmin), [isAdmin])
    const [menuOpenKeys, setMenuOpenKeys] = useState<string[]>(() =>
        location.pathname.startsWith('/trends')
            ? ['/trends']
            : location.pathname.startsWith('/admin')
                ? ['/admin']
                : location.pathname.startsWith('/youtube') || location.pathname.startsWith('/research')
                    ? ['/youtube']
                    : []
    )

    const selectedKey = resolveSelectedKey(location.pathname)

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                className="trendy-sidebar"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                theme={dark ? 'dark' : 'light'}
                width={220}
                style={{
                    background: token.colorBgContainer,
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    overflow: 'hidden',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div
                    style={{
                        height: HEADER_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: token.colorTextHeading,
                        fontSize: collapsed ? 22 : 18,
                        fontWeight: 700,
                        letterSpacing: '-0.4px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        userSelect: 'none',
                    }}
                >
                    {collapsed ? '🔥' : '🔥 Trendy'}
                </div>

                <div
                    className="trendy-sidebar-scroll"
                    style={{
                        height: `calc(100vh - ${HEADER_HEIGHT}px - ${SIDER_TRIGGER_HEIGHT}px)`,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        paddingBottom: 8,
                    }}
                >
                    <Menu
                        className="trendy-nav-menu"
                        theme={dark ? 'dark' : 'light'}
                        mode="inline"
                        triggerSubMenuAction="click"
                        selectedKeys={[selectedKey]}
                        openKeys={collapsed ? undefined : menuOpenKeys}
                        onOpenChange={(keys) => {
                            if (collapsed) return
                            // Accordion: open the newly clicked submenu, close others
                            const latestKey = keys.find(k => !menuOpenKeys.includes(k))
                            setMenuOpenKeys(latestKey ? [latestKey] : [])
                        }}
                        onClick={({ key }) => {
                            const nextKey = String(key)
                            if (nextKey === '/trends') {
                                setMenuOpenKeys(['/trends'])
                                navigate('/trends/explore')
                                return
                            }
                            if (nextKey === '/youtube') {
                                setMenuOpenKeys(['/youtube'])
                                navigate('/youtube/search')
                                return
                            }
                            if (nextKey === '/admin') {
                                setMenuOpenKeys(['/admin'])
                                navigate('/admin/users')
                                return
                            }
                            // Keep the parent submenu open when clicking a leaf
                            if (nextKey.startsWith('/trends/')) setMenuOpenKeys(['/trends'])
                            else if (nextKey.startsWith('/youtube/')) setMenuOpenKeys(['/youtube'])
                            else if (nextKey.startsWith('/admin/')) setMenuOpenKeys(['/admin'])
                            else setMenuOpenKeys([])
                            navigate(nextKey)
                        }}
                        items={navItems}
                        style={{ marginTop: 8, background: 'transparent', borderInlineEnd: 'none', width: '100%' }}
                    />
                </div>
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 220, minWidth: 0, transition: 'margin-left 0.2s' }}>
                <Header
                    style={{
                        background: token.colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 24px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        height: HEADER_HEIGHT,
                        lineHeight: `${HEADER_HEIGHT}px`,
                    }}
                >
                    <Typography.Text strong style={{ fontSize: 18 }}>
                        Trendy
                    </Typography.Text>
                    <Space size={10} style={{ minWidth: 0 }}>
                        <Typography.Text ellipsis style={{ maxWidth: 260 }} title={user?.email ?? ''} type="secondary">
                            {user?.email}
                        </Typography.Text>
                        <Button onClick={logout}>Logout</Button>
                        <Button
                            type="text"
                            icon={dark ? <Sun size={18} /> : <Moon size={18} />}
                            onClick={() => setDark(!dark)}
                            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                        />
                    </Space>
                </Header>

                <Content
                    style={{
                        minWidth: 0,
                        margin: 24,
                        padding: 24,
                        background: token.colorBgContainer,
                        borderRadius: token.borderRadius,
                        minHeight: 280,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    )
}
