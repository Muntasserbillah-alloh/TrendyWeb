import { Pagination as AntPagination } from 'antd'

interface PaginationProps {
    page: number
    perPage: number
    total: number
    onChange: (page: number) => void
}

export function Pagination({ page, perPage, total, onChange }: PaginationProps) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <AntPagination
                current={page}
                pageSize={perPage}
                total={total}
                onChange={onChange}
                showSizeChanger={false}
                showTotal={(t) => `${t} total`}
            />
        </div>
    )
}
