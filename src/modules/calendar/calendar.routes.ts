import { Router } from 'express'
import { requireRole } from '@/common/middleware/auth.middleware'
import { validate } from '@/common/middleware/validate.middleware'
import { Role } from '@/generated/prisma/enums'
import * as calendarController from '@/modules/calendar/calendar.controller'
import { calendarQuerySchema, summaryQuerySchema } from '@/modules/calendar/calendar.schema'

export const calendarRouter = Router()
calendarRouter.get('/', validate({ query: calendarQuerySchema }), calendarController.month)
calendarRouter.get('/teams', requireRole(Role.HR_ADMIN), calendarController.teams)
calendarRouter.get(
  '/summary',
  requireRole(Role.MANAGER, Role.HR_ADMIN),
  validate({ query: summaryQuerySchema }),
  calendarController.summary,
)
