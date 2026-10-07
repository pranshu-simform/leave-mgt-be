import { Router } from 'express'
import { requireRole } from '@/common/middleware/auth.middleware'
import { validate } from '@/common/middleware/validate.middleware'
import { idParamSchema } from '@/common/validators/common.schema'
import { APPROVER_ROLES } from '@/modules/approvals/constants/approval.constants'
import * as approvalController from '@/modules/approvals/controllers/approval.controller'
import { approvalQuerySchema, rejectSchema } from '@/modules/approvals/schemas/approval.schema'

export const approvalRouter = Router()
approvalRouter.get(
  '/approvals',
  requireRole(...APPROVER_ROLES),
  validate({ query: approvalQuerySchema }),
  approvalController.list,
)
approvalRouter.get(
  '/approvals/:id/overlaps',
  requireRole(...APPROVER_ROLES),
  validate({ params: idParamSchema }),
  approvalController.overlaps,
)
approvalRouter.post(
  '/leave-requests/:id/approve',
  requireRole(...APPROVER_ROLES),
  validate({ params: idParamSchema }),
  approvalController.approve,
)
approvalRouter.post(
  '/leave-requests/:id/reject',
  requireRole(...APPROVER_ROLES),
  validate({ params: idParamSchema, body: rejectSchema }),
  approvalController.reject,
)
