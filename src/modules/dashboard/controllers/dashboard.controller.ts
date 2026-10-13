import type { Request, Response } from 'express'
import { ok } from '@/common/utils/response'
import { getDashboard } from '@/modules/dashboard/services/dashboard.service'
import type { DashboardQuery } from '@/modules/dashboard/types/dashboard.types'

export async function stats(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as DashboardQuery
  res.json(ok(await getDashboard(req.user!, query)))
}
