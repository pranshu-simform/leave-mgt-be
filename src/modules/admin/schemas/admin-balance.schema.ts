import { z } from 'zod'
import { isoYear, todayIso } from '@/common/utils/dates'
import {
  ADJUST_NOTE_MAX_LENGTH,
  ADMIN_YEAR_MAX,
  ADMIN_YEAR_MIN,
  LEAVE_DAYS_MAX,
} from '@/modules/admin/constants/admin.constants'

const year = z
  .number('Year is required')
  .int('Year must be a whole number')
  .min(ADMIN_YEAR_MIN, `Year must be ${ADMIN_YEAR_MIN} or later`)
  .max(ADMIN_YEAR_MAX, `Year must be ${ADMIN_YEAR_MAX} or earlier`)

export const allocateBalancesSchema = z.strictObject({
  year: year.refine((value) => {
    const thisYear = isoYear(todayIso())
    return value === thisYear || value === thisYear + 1
  }, 'Year must be this year or next year'),
})

export const adjustBalanceSchema = z.strictObject({
  userId: z.uuid('Invalid user'),
  leaveTypeId: z.uuid('Invalid leave type'),
  year,
  delta: z
    .number('Days change is required')
    .int('Days change must be a whole number')
    .min(-LEAVE_DAYS_MAX, `Days change must be between -${LEAVE_DAYS_MAX} and ${LEAVE_DAYS_MAX}`)
    .max(LEAVE_DAYS_MAX, `Days change must be between -${LEAVE_DAYS_MAX} and ${LEAVE_DAYS_MAX}`)
    .refine((value) => value !== 0, 'Days change cannot be zero'),
  note: z
    .string('Note is required')
    .trim()
    .min(1, 'Note is required')
    .max(ADJUST_NOTE_MAX_LENGTH, `Note must be at most ${ADJUST_NOTE_MAX_LENGTH} characters`),
})
