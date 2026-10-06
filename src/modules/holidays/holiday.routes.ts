import { Router } from 'express'
import { validate } from '@/common/middleware/validate.middleware'
import * as holidayController from '@/modules/holidays/holiday.controller'
import { holidayQuerySchema } from '@/modules/holidays/holiday.schema'

export const holidayRouter = Router()
holidayRouter.get('/', validate({ query: holidayQuerySchema }), holidayController.list)
