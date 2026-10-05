import type { Request, Response } from 'express'
import { paginated } from '@/common/utils/response'
import type { CalendarQuery, SummaryQuery } from '@/modules/calendar/calendar.schema'
import { getCalendar, getCalendarSummary } from '@/modules/calendar/calendar.service'

export async function month(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as CalendarQuery
  const { items, pagination } = await getCalendar(req.user!, query)
  res.json(paginated(items, pagination))
}

export async function summary(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as SummaryQuery
  const { items, pagination } = await getCalendarSummary(req.user!, query)
  res.json(paginated(items, pagination))
}
