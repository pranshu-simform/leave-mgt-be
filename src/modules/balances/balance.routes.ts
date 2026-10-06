import { Router } from 'express'
import { validate } from '@/common/middleware/validate.middleware'
import { idParamSchema } from '@/common/validators/common.schema'
import * as balanceController from '@/modules/balances/balance.controller'
import { balanceQuerySchema } from '@/modules/balances/balance.schema'

export const balanceRouter = Router()
balanceRouter.get(
  '/balances/me',
  validate({ query: balanceQuerySchema }),
  balanceController.getMine,
)
balanceRouter.get(
  '/users/:id/balances',
  validate({ params: idParamSchema, query: balanceQuerySchema }),
  balanceController.getForUser,
)
