import { z } from 'zod'
import { LeaveStatus } from '@/generated/prisma/enums'
import { isoYear, todayIso } from '@/common/utils/dates'
import { paginationQuerySchema } from '@/common/validators/common.schema'
import { ADMIN_YEAR_MAX, ADMIN_YEAR_MIN } from '@/modules/admin/constants/admin.constants'

export const requestListQuerySchema = paginationQuerySchema.extend({
  year: z.coerce
    .number('Year must be a number')
    .int('Year must be a whole number')
    .min(ADMIN_YEAR_MIN, `Year must be ${ADMIN_YEAR_MIN} or later`)
    .max(ADMIN_YEAR_MAX, `Year must be ${ADMIN_YEAR_MAX} or earlier`)
    .default(() => isoYear(todayIso())),
  status: z.enum(LeaveStatus).optional(),
  leaveTypeId: z.uuid('Invalid leave type').optional(),
  userId: z.uuid('Invalid user').optional(),
})
