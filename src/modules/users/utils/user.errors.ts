import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { isUniqueViolation } from '@/common/utils/error.guards'
import { USER_EMAIL_INDEX } from '@/modules/users/constants/user.constants'

export function toUserError(err: unknown): unknown {
  return isUniqueViolation(err, USER_EMAIL_INDEX)
    ? new AppError(ERROR_CODES.ALREADY_EXISTS, 409, 'A user with this email already exists')
    : err
}

export function invalidManager(): AppError {
  return new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Invalid request', [
    { field: 'managerId', message: 'Choose an active manager' },
  ])
}
