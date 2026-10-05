import type { ErrorCode } from '@/common/errors/errorCodes'
import type { ApiErrorDetail } from '@/common/types/common.types'

export class AppError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details?: ApiErrorDetail[]

  constructor(code: ErrorCode, status: number, message: string, details?: ApiErrorDetail[]) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = details
  }
}
