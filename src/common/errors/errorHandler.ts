import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { bodyParserErrorType, isUniqueViolation } from '@/common/utils/error.guards'

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err

  switch (bodyParserErrorType(err)) {
    case 'entity.parse.failed':
      return new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Malformed JSON body')
    case 'entity.too.large':
      return new AppError(ERROR_CODES.PAYLOAD_TOO_LARGE, 413, 'Request body is too large')
  }

  if (isUniqueViolation(err)) {
    return new AppError(ERROR_CODES.ALREADY_EXISTS, 409, 'This record already exists')
  }

  const message = err instanceof Error ? err.message : 'Unexpected error'
  return new AppError(ERROR_CODES.INTERNAL_ERROR, 500, message)
}
