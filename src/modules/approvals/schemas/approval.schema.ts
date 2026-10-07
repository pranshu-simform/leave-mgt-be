import { z } from 'zod'
import { LeaveStatus } from '@/generated/prisma/enums'
import { paginationQuerySchema } from '@/common/validators/common.schema'
import { REJECT_REASON_MAX_LENGTH } from '@/modules/approvals/constants/approval.constants'

export const approvalQuerySchema = paginationQuerySchema.extend({
  status: z.enum(LeaveStatus).default('PENDING'),
})

export const rejectSchema = z.object({
  reason: z
    .string('Reason is required')
    .trim()
    .min(1, 'Reason is required')
    .max(REJECT_REASON_MAX_LENGTH, `Reason must be at most ${REJECT_REASON_MAX_LENGTH} characters`),
})
