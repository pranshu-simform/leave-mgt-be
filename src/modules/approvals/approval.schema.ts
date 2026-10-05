import { z } from 'zod'
import { LeaveStatus } from '@/generated/prisma/enums'
import { paginationQuerySchema } from '@/common/validators/common.schema'

export const approvalQuerySchema = paginationQuerySchema.extend({
  status: z.enum(LeaveStatus).default('PENDING'),
})
export type ApprovalQuery = z.infer<typeof approvalQuerySchema>

export const rejectSchema = z.object({
  reason: z
    .string('Reason is required')
    .trim()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be at most 500 characters'),
})
export type RejectInput = z.infer<typeof rejectSchema>
