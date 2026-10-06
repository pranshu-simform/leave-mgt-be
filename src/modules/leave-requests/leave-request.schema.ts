import { z } from 'zod'
import { LeaveStatus } from '@/generated/prisma/enums'
import { isoDateSchema, paginationQuerySchema } from '@/common/validators/common.schema'

const note = z.string().trim().max(500, 'Note must be at most 500 characters').optional()

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
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>

export const updateLeaveRequestSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    note,
    version: z.number('Version is required').int().min(1),
  })
  .refine((value) => value.startDate <= value.endDate, endNotBeforeStart)
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>

export const historyQuerySchema = paginationQuerySchema
export type HistoryQuery = z.infer<typeof historyQuerySchema>

export const listLeaveRequestsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(LeaveStatus).optional(),
  year: z.coerce.number('Year must be a number').int().min(2000).max(2100).optional(),
  leaveTypeId: z.uuid('Invalid leave type').optional(),
  // Requests that end on or after this date, soonest first (the "upcoming" view).
  from: isoDateSchema.optional(),
})
export type ListLeaveRequestsQuery = z.infer<typeof listLeaveRequestsQuerySchema>
