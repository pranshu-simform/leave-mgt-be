import { Prisma } from '@/generated/prisma/client'
import { isoToDate } from '@/common/utils/dates'
import type { CalendarFilter, DateWindow } from '@/modules/calendar/types/calendar.types'

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

export function weekdays({ from, to }: DateWindow) {
  return Prisma.sql`SELECT d.day::date AS day
    FROM generate_series(${from}::timestamp, ${to}::timestamp, interval '1 day') AS d(day)
    WHERE extract(isodow FROM d.day) < 6`
}
