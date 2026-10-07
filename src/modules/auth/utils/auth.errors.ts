import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'

export function invalidCredentials(): AppError {
  return new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Invalid email or password')
}

export function authRequired(): AppError {
  return new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Authentication required')
}
