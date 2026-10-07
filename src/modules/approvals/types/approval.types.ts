import type { z } from 'zod'
import type { approvalQuerySchema, rejectSchema } from '@/modules/approvals/schemas/approval.schema'

export type ApprovalQuery = z.infer<typeof approvalQuerySchema>
export type RejectInput = z.infer<typeof rejectSchema>
