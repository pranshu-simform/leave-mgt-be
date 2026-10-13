import { Router } from 'express'
import { requireRole } from '@/common/middleware/auth.middleware'
import { validate } from '@/common/middleware/validate.middleware'
import { idParamSchema } from '@/common/validators/common.schema'
import { ADMIN_ROLES } from '@/modules/admin/constants/admin.constants'
import * as balanceController from '@/modules/admin/controllers/admin-balance.controller'
import * as holidayController from '@/modules/admin/controllers/admin-holiday.controller'
import * as leaveTypeController from '@/modules/admin/controllers/admin-leave-type.controller'
import * as requestController from '@/modules/admin/controllers/admin-request.controller'
import * as userController from '@/modules/admin/controllers/admin-user.controller'
import {
  adjustBalanceSchema,
  allocateBalancesSchema,
  reconcileQuerySchema,
} from '@/modules/admin/schemas/admin-balance.schema'
import {
  createHolidaySchema,
  holidayYearQuerySchema,
} from '@/modules/admin/schemas/admin-holiday.schema'
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
} from '@/modules/admin/schemas/admin-leave-type.schema'
import { requestListQuerySchema } from '@/modules/admin/schemas/admin-request.schema'
import { userListQuerySchema } from '@/modules/admin/schemas/admin-user.schema'

export const adminRouter = Router()

adminRouter.use(requireRole(...ADMIN_ROLES))

adminRouter.get('/leave-types', leaveTypeController.list)
adminRouter.post(
  '/leave-types',
  validate({ body: createLeaveTypeSchema }),
  leaveTypeController.create,
)
adminRouter.patch(
  '/leave-types/:id',
  validate({ params: idParamSchema, body: updateLeaveTypeSchema }),
  leaveTypeController.update,
)

adminRouter.get('/holidays', validate({ query: holidayYearQuerySchema }), holidayController.list)
adminRouter.post('/holidays', validate({ body: createHolidaySchema }), holidayController.create)
adminRouter.delete('/holidays/:id', validate({ params: idParamSchema }), holidayController.remove)

adminRouter.post(
  '/balances/allocate',
  validate({ body: allocateBalancesSchema }),
  balanceController.allocate,
)
adminRouter.post(
  '/balances/adjust',
  validate({ body: adjustBalanceSchema }),
  balanceController.adjust,
)
adminRouter.get(
  '/balances/reconcile',
  validate({ query: reconcileQuerySchema }),
  balanceController.reconcile,
)

adminRouter.get('/users', validate({ query: userListQuerySchema }), userController.list)
adminRouter.get('/requests', validate({ query: requestListQuerySchema }), requestController.list)
