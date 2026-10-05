import { Router } from 'express'
import { validate } from '@/common/middleware/validate.middleware'
import { idParamSchema } from '@/common/validators/common.schema'
import * as leaveRequestController from '@/modules/leave-requests/leave-request.controller'
import {
  createLeaveRequestSchema,
  listLeaveRequestsQuerySchema,
  updateLeaveRequestSchema,
} from '@/modules/leave-requests/leave-request.schema'

export const leaveRequestRouter = Router()

leaveRequestRouter.post(
  '/preview',
  validate({ body: createLeaveRequestSchema }),
  leaveRequestController.preview,
)
leaveRequestRouter.post(
  '/',
  validate({ body: createLeaveRequestSchema }),
  leaveRequestController.submit,
)
leaveRequestRouter.get(
  '/',
  validate({ query: listLeaveRequestsQuerySchema }),
  leaveRequestController.listMine,
)
leaveRequestRouter.get('/:id', validate({ params: idParamSchema }), leaveRequestController.getOne)
leaveRequestRouter.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateLeaveRequestSchema }),
  leaveRequestController.update,
)
leaveRequestRouter.post(
  '/:id/cancel',
  validate({ params: idParamSchema }),
  leaveRequestController.cancel,
)
