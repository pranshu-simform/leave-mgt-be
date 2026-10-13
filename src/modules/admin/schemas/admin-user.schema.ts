import { z } from 'zod'
import { Role } from '@/generated/prisma/enums'
import { paginationQuerySchema } from '@/common/validators/common.schema'
import { USER_SEARCH_MAX_LENGTH } from '@/modules/admin/constants/admin.constants'

export const userListQuerySchema = paginationQuerySchema.extend({
  search: z
    .string()
    .trim()
    .max(USER_SEARCH_MAX_LENGTH, `Search must be at most ${USER_SEARCH_MAX_LENGTH} characters`)
    .optional(),
  role: z.enum(Role).optional(),
  isActive: z
    .enum(['true', 'false'], 'isActive must be true or false')
    .transform((value) => value === 'true')
    .optional(),
})
