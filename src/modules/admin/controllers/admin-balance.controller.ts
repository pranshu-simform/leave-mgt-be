import type { Request, Response } from 'express'
import { ok } from '@/common/utils/response'
import { adjustBalance, allocateBalances } from '@/modules/balances'
import type { AdjustBalanceInput, AllocateBalancesInput } from '@/modules/admin/types/admin.types'

export async function allocate(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as AllocateBalancesInput
  res.json(ok(await allocateBalances(req.user!, body.year), 'Balances allocated'))
}

export async function adjust(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as AdjustBalanceInput
  res.json(ok(await adjustBalance(req.user!, body), 'Balance adjusted'))
}
