import type { ErrorCode } from '@/common/errors/errorCodes'

export interface ApiErrorDetail {
  field: string
  message: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ApiSuccessResponse<T> {
  success: true
  message?: string
  data: T
}

export interface ApiPaginatedResponse<T> {
  success: true
  message?: string
  data: T[]
  pagination: Pagination
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: ApiErrorDetail[]
  }
}
