import type { z } from 'zod'
import type {
  createHolidaySchema,
  holidayYearQuerySchema,
} from '@/modules/admin/schemas/admin-holiday.schema'
import type {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
} from '@/modules/admin/schemas/admin-leave-type.schema'

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>
export type HolidayYearQuery = z.infer<typeof holidayYearQuerySchema>
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>
