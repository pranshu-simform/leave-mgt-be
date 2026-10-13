import { Router } from 'express'
import { validate } from '@/common/middleware/validate.middleware'
import * as dashboardController from '@/modules/dashboard/controllers/dashboard.controller'
import { dashboardQuerySchema } from '@/modules/dashboard/schemas/dashboard.schema'

export const dashboardRouter = Router()
dashboardRouter.get('/', validate({ query: dashboardQuerySchema }), dashboardController.stats)
