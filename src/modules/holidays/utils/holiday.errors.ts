import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { isUniqueViolation } from '@/common/utils/error.guards'
import { HOLIDAY_DATE_INDEX } from '@/modules/holidays/constants/holiday.constants'

export function toHolidayError(err: unknown): unknown {
  return isUniqueViolation(err, HOLIDAY_DATE_INDEX)
    ? new AppError(ERROR_CODES.ALREADY_EXISTS, 409, 'A holiday already exists on this date')
    : err
}
