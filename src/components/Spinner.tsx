import { Spin } from 'antd'

export function Spinner({ tip = 'Loading...' }: { tip?: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <Spin size="large" tip={tip} />
        </div>
    )
}
