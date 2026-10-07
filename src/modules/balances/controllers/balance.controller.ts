import type { Request, Response } from 'express'
import type { IdParam } from '@/common/validators/common.schema'
import { ok } from '@/common/utils/response'
import type { BalanceQuery } from '@/modules/balances/types/balance.types'
import * as balanceService from '@/modules/balances/services/balance.service'

export async function getMine(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as BalanceQuery
  res.json(ok(await balanceService.getBalances(req.user!.id, query.year)))
}

export async function getForUser(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  const query = req.validated?.query as BalanceQuery
  res.json(ok(await balanceService.getBalancesForUser(req.user!, params.id, query.year)))
}
