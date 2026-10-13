import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { isExclusionViolation } from '@/common/utils/error.guards'
import { NO_OVERLAP_CONSTRAINT } from '@/modules/leave-requests/constants/leave-request.constants'

export function notFound(): AppError {
  return new AppError(ERROR_CODES.NOT_FOUND, 404, 'Leave request not found')
}

export function toRequestError(err: unknown): unknown {
  return isExclusionViolation(err, NO_OVERLAP_CONSTRAINT)
    ? new AppError(
        ERROR_CODES.OVERLAPPING_REQUEST,
        409,
        'You already have leave on some of these dates',
      )
    : err
}
