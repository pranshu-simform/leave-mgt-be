import { z } from 'zod'
import { todayIso, isoYear } from '@/common/utils/dates'
import { isoDateSchema, paginationQuerySchema } from '@/common/validators/common.schema'
import {
  ADMIN_YEAR_MAX,
  ADMIN_YEAR_MIN,
  HOLIDAY_NAME_MAX_LENGTH,
} from '@/modules/admin/constants/admin.constants'

export const holidayYearQuerySchema = paginationQuerySchema.extend({
  year: z.coerce
    .number('Year must be a number')
    .int('Year must be a whole number')
    .min(ADMIN_YEAR_MIN, `Year must be ${ADMIN_YEAR_MIN} or later`)
    .max(ADMIN_YEAR_MAX, `Year must be ${ADMIN_YEAR_MAX} or earlier`)
    .default(() => isoYear(todayIso())),
})

export const createHolidaySchema = z.strictObject({
  date: isoDateSchema,
  name: z
    .string('Name is required')
    .trim()
    .min(1, 'Name is required')
    .max(HOLIDAY_NAME_MAX_LENGTH, `Name must be at most ${HOLIDAY_NAME_MAX_LENGTH} characters`),
})
