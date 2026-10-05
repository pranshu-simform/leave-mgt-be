import { Router } from 'express'
import { requireRole } from '@/common/middleware/auth.middleware'
import { validate } from '@/common/middleware/validate.middleware'
import { idParamSchema } from '@/common/validators/common.schema'
import { Role } from '@/generated/prisma/enums'
import * as approvalController from '@/modules/approvals/approval.controller'
import { approvalQuerySchema, rejectSchema } from '@/modules/approvals/approval.schema'

const approversOnly = requireRole(Role.MANAGER, Role.HR_ADMIN)

export const approvalRouter = Router()
approvalRouter.get(
  '/approvals',
  approversOnly,
  validate({ query: approvalQuerySchema }),
  approvalController.list,
)
approvalRouter.post(
  '/leave-requests/:id/approve',
  approversOnly,
  validate({ params: idParamSchema }),
  approvalController.approve,
)
approvalRouter.post(
  '/leave-requests/:id/reject',
  approversOnly,
  validate({ params: idParamSchema, body: rejectSchema }),
  approvalController.reject,
)
