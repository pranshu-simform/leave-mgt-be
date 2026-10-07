import type { Request, Response } from 'express'
import { ok, paginated } from '@/common/utils/response'
import type { IdParam } from '@/common/types/common.types'
import { createHoliday, deleteHoliday, listHolidaysForYear } from '@/modules/holidays'
import type { CreateHolidayInput, HolidayYearQuery } from '@/modules/admin/types/admin.types'

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as HolidayYearQuery
  const { items, pagination } = await listHolidaysForYear(query.year, query.page, query.limit)
  res.json(paginated(items, pagination))
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateHolidayInput
  res.status(201).json(ok(await createHoliday(body), 'Holiday added'))
}

export async function remove(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  res.json(ok(await deleteHoliday(params.id), 'Holiday deleted'))
}
