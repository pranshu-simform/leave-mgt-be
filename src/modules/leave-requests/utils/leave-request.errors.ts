import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'

export function notFound(): AppError {
  return new AppError(ERROR_CODES.NOT_FOUND, 404, 'Leave request not found')
}
