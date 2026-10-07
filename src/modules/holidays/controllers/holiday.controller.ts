import type { Request, Response } from 'express'
import { ok } from '@/common/utils/response'
import type { HolidayQuery } from '@/modules/holidays/types/holiday.types'
import { listHolidays } from '@/modules/holidays/services/holiday.service'

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as HolidayQuery
  res.json(ok(await listHolidays(query.month)))
}
