import type { ErrorCode } from '@/common/errors/errorCodes'
import type {
  ApiErrorDetail,
  ApiErrorResponse,
  ApiPaginatedResponse,
  ApiSuccessResponse,
  Pagination,
} from '@/common/types/common.types'

export function ok<T>(data: T, message?: string): ApiSuccessResponse<T> {
  return { success: true, ...(message ? { message } : {}), data }
}

export function paginated<T>(
  items: T[],
  pagination: Pagination,
  message?: string,
): ApiPaginatedResponse<T> {
  return {
    success: true,
    ...(message ? { message } : {}),
    data: items,
    pagination,
  }
}

export function fail(
  code: ErrorCode,
  message: string,
  details?: ApiErrorDetail[],
): ApiErrorResponse {
  return {
    success: false,
    error: { code, message, ...(details?.length ? { details } : {}) },
  }
}
