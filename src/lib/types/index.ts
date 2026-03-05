export * from './database'

// ============================================================
// UI Types
// ============================================================

export interface NavItem {
  title: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}

export interface BreadcrumbItem {
  title: string
  href?: string
}

export interface TableColumn<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

export interface PaginationParams {
  page: number
  pageSize: number
  total: number
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}
