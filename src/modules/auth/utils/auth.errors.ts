import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'

export function invalidCredentials(): AppError {
  return new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Invalid email or password')
}

export function authRequired(): AppError {
  return new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Authentication required')
}

export function invalidLink(): AppError {
  return new AppError(
    ERROR_CODES.INVALID_LINK,
    400,
    'This link is invalid or has expired. Ask HR to send a new one',
  )
}
