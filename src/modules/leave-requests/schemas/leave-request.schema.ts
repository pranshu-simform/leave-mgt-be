import { z } from 'zod'
import { LeaveStatus } from '@/generated/prisma/enums'
import { isoDateSchema, paginationQuerySchema } from '@/common/validators/common.schema'
import {
  NOTE_MAX_LENGTH,
  REQUEST_YEAR_MAX,
  REQUEST_YEAR_MIN,
} from '@/modules/leave-requests/constants/leave-request.constants'

const note = z
  .string()
  .trim()
  .max(NOTE_MAX_LENGTH, `Note must be at most ${NOTE_MAX_LENGTH} characters`)
  .optional()

const endNotBeforeStart = {
  path: ['endDate'],
  message: 'End date must be on or after the start date',
  when: (payload: { issues: readonly unknown[] }) => payload.issues.length === 0,
}

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: z.uuid('Invalid leave type'),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    note,
  })
  .refine((value) => value.startDate <= value.endDate, endNotBeforeStart)

export const updateLeaveRequestSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    note,
    version: z.number('Version is required').int().min(1),
  })
  .refine((value) => value.startDate <= value.endDate, endNotBeforeStart)

export const historyQuerySchema = paginationQuerySchema

export const listLeaveRequestsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(LeaveStatus).optional(),
  year: z.coerce
    .number('Year must be a number')
    .int()
    .min(REQUEST_YEAR_MIN)
    .max(REQUEST_YEAR_MAX)
    .optional(),
  leaveTypeId: z.uuid('Invalid leave type').optional(),
  // Requests that end on or after this date, soonest first (the "upcoming" view).
  from: isoDateSchema.optional(),
})
