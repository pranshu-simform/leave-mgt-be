import type { z } from 'zod'
import type { ErrorCode } from '@/common/errors/errorCodes'
import type { idParamSchema, paginationQuerySchema } from '@/common/validators/common.schema'

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

export type ValidationSource = 'body' | 'query' | 'params'

export interface SkipTake {
  skip: number
  take: number
}

export interface IsoRange {
  from: string
  to: string
}

export interface PostgresErrorInfo {
  code: string
  message: string
}

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export type IdParam = z.infer<typeof idParamSchema>
