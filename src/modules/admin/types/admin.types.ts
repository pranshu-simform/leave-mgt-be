import type { z } from 'zod'
import type {
  adjustBalanceSchema,
  allocateBalancesSchema,
} from '@/modules/admin/schemas/admin-balance.schema'
import type {
  createHolidaySchema,
  holidayYearQuerySchema,
} from '@/modules/admin/schemas/admin-holiday.schema'
import type { requestListQuerySchema } from '@/modules/admin/schemas/admin-request.schema'
import type {
  createUserSchema,
  userListQuerySchema,
} from '@/modules/admin/schemas/admin-user.schema'
import type {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
} from '@/modules/admin/schemas/admin-leave-type.schema'

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>
export type HolidayYearQuery = z.infer<typeof holidayYearQuerySchema>
export type CreateHolidayInput = z.infer<typeof createHolidaySchema>
export type AllocateBalancesInput = z.infer<typeof allocateBalancesSchema>
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>
export type UserListQuery = z.infer<typeof userListQuerySchema>
export type RequestListQuery = z.infer<typeof requestListQuerySchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
