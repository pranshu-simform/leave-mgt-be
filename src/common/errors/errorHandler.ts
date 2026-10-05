import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'

function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string') {
    return err.type
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function postgresError(err: unknown): { code: string; message: string } | undefined {
  if (!isRecord(err) || !isRecord(err.meta) || !isRecord(err.meta.driverAdapterError)) return
  const cause = err.meta.driverAdapterError.cause
  if (isRecord(cause) && typeof cause.code === 'string' && typeof cause.message === 'string') {
    return { code: cause.code, message: cause.message }
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err

  switch (bodyParserErrorType(err)) {
    case 'entity.parse.failed':
      return new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Malformed JSON body')
    case 'entity.too.large':
      return new AppError(ERROR_CODES.PAYLOAD_TOO_LARGE, 413, 'Request body is too large')
  }

  const pgError = postgresError(err)
  if (pgError?.code === '23P01' && pgError.message.includes('leave_requests_no_overlap')) {
    return new AppError(
      ERROR_CODES.OVERLAPPING_REQUEST,
      409,
      'You already have leave on some of these dates',
    )
  }

  const message = err instanceof Error ? err.message : 'Unexpected error'
  return new AppError(ERROR_CODES.INTERNAL_ERROR, 500, message)
}
