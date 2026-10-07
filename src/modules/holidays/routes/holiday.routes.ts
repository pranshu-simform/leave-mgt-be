import { Router } from 'express'
import { validate } from '@/common/middleware/validate.middleware'
import * as holidayController from '@/modules/holidays/controllers/holiday.controller'
import { holidayQuerySchema } from '@/modules/holidays/schemas/holiday.schema'

export const holidayRouter = Router()
holidayRouter.get('/', validate({ query: holidayQuerySchema }), holidayController.list)
