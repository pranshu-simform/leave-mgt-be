import { z } from 'zod'
import { Role } from '@/generated/prisma/enums'
import { paginationQuerySchema } from '@/common/validators/common.schema'
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_SEARCH_MAX_LENGTH,
} from '@/modules/admin/constants/admin.constants'

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

export const createUserSchema = z.strictObject({
  name: z
    .string('Name is required')
    .trim()
    .min(1, 'Name is required')
    .max(USER_NAME_MAX_LENGTH, `Name must be at most ${USER_NAME_MAX_LENGTH} characters`),
  email: z
    .string('Email is required')
    .trim()
    .toLowerCase()
    .max(USER_EMAIL_MAX_LENGTH, `Email must be at most ${USER_EMAIL_MAX_LENGTH} characters`)
    .pipe(z.email('Enter a valid email address')),
  role: z.enum(Role, 'Choose a role'),
  managerId: z.uuid('Invalid manager').nullable().default(null),
})
