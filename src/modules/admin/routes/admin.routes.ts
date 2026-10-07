import { Router } from 'express'
import { requireRole } from '@/common/middleware/auth.middleware'
import { validate } from '@/common/middleware/validate.middleware'
import { idParamSchema } from '@/common/validators/common.schema'
import { ADMIN_ROLES } from '@/modules/admin/constants/admin.constants'
import * as holidayController from '@/modules/admin/controllers/admin-holiday.controller'
import * as leaveTypeController from '@/modules/admin/controllers/admin-leave-type.controller'
import {
  createHolidaySchema,
  holidayYearQuerySchema,
} from '@/modules/admin/schemas/admin-holiday.schema'
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
} from '@/modules/admin/schemas/admin-leave-type.schema'

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
