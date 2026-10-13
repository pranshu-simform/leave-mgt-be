import { Prisma } from '@/generated/prisma/client'
import { isoToDate } from '@/common/utils/dates'
import type {
  CalendarFilter,
  DateWindow,
  OverlapKey,
} from '@/modules/calendar/types/calendar.types'

export function calendarRequestWhere({
  managerId,
  status,
  from,
  to,
}: CalendarFilter): Prisma.LeaveRequestWhereInput {
  return {
    status: status ?? { in: ['PENDING', 'APPROVED'] },
    startDate: { lte: isoToDate(to) },
    endDate: { gte: isoToDate(from) },
    user: { isActive: true, ...(managerId ? { managerId } : {}) },
  }
}

export function teamOverlapSql({ managerId, from, to }: Omit<OverlapKey, 'userId'>) {
  return Prisma.sql`u.is_active
    AND u.manager_id = ${managerId}::uuid
    AND r.status IN ('PENDING', 'APPROVED')
    AND daterange(r.start_date, r.end_date, '[]') && daterange(${from}::date, ${to}::date, '[]')`
}

export function weekdays({ from, to }: DateWindow) {
  return Prisma.sql`SELECT d.day::date AS day
    FROM generate_series(${from}::timestamp, ${to}::timestamp, interval '1 day') AS d(day)
    WHERE extract(isodow FROM d.day) < 6`
}
