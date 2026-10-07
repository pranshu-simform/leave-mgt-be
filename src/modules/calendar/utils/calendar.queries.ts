import { Prisma } from '@/generated/prisma/client'
import type { CalendarFilter, DateWindow } from '@/modules/calendar/types/calendar.types'

export function calendarWhere({ managerId, status, from, to }: CalendarFilter) {
  return Prisma.sql`u.is_active
    ${managerId ? Prisma.sql`AND u.manager_id = ${managerId}::uuid` : Prisma.empty}
    AND r.status IN ('PENDING', 'APPROVED')
    ${status ? Prisma.sql`AND r.status = ${status}::"LeaveStatus"` : Prisma.empty}
    AND daterange(r.start_date, r.end_date, '[]') && daterange(${from}::date, ${to}::date, '[]')`
}

export function weekdays({ from, to }: DateWindow) {
  return Prisma.sql`SELECT d.day::date AS day
    FROM generate_series(${from}::timestamp, ${to}::timestamp, interval '1 day') AS d(day)
    WHERE extract(isodow FROM d.day) < 6`
}
