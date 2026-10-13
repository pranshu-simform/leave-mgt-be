import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { isUniqueViolation } from '@/common/utils/error.guards'
import { LEAVE_TYPE_CODE_INDEX } from '@/modules/leave-types/constants/leave-type.constants'

export function toLeaveTypeError(err: unknown): unknown {
  return isUniqueViolation(err, LEAVE_TYPE_CODE_INDEX)
    ? new AppError(ERROR_CODES.ALREADY_EXISTS, 409, 'A leave type with this code already exists')
    : err
}
