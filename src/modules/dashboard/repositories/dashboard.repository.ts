import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'
import { MAX_MONTHLY_ROWS } from '@/modules/dashboard/constants/dashboard.constants'
import type {
  MonthlyDays,
  MonthlyFilter,
  TeamScope,
} from '@/modules/dashboard/types/dashboard.types'
import { teamMemberFilter } from '@/modules/dashboard/utils/dashboard.queries'

export const dashboardRepository = {
  // Approved working days per month and leave type. Each request is expanded to its days inside
  // the year, minus weekends and public holidays (the same rule as a request's `days`), so a leave
  // that crosses a month end is split between the two months.
  monthly: (db: Db, { userId, from, to }: MonthlyFilter) =>
    db.$queryRaw<MonthlyDays[]>`
      SELECT to_char(d.day, 'YYYY-MM') AS month, lt.id AS "leaveTypeId", lt.name,
        count(*)::int AS days
      FROM leave_requests r
      JOIN leave_types lt ON lt.id = r.leave_type_id
      CROSS JOIN LATERAL generate_series(
        greatest(r.start_date, ${from}::date)::timestamp,
        least(r.end_date, ${to}::date)::timestamp,
        interval '1 day'
      ) AS d(day)
      WHERE r.user_id = ${userId}::uuid AND r.status = 'APPROVED'
        AND daterange(r.start_date, r.end_date, '[]') && daterange(${from}::date, ${to}::date, '[]')
        AND extract(isodow FROM d.day) < 6
        AND NOT EXISTS (SELECT 1 FROM public_holidays h WHERE h.date = d.day::date)
      GROUP BY 1, lt.id, lt.name
      ORDER BY 1, lt.id
      LIMIT ${MAX_MONTHLY_ROWS}`,

  teamSize: (db: Db, scope: TeamScope) => db.user.count({ where: teamMemberFilter(scope) }),

  awayOn: (db: Db, scope: TeamScope, day: string) => {
    const date = isoToDate(day)
    return db.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: date },
        endDate: { gte: date },
        user: teamMemberFilter(scope),
      },
    })
  },

  statusCountsOn: (db: Db, scope: TeamScope, day: string) => {
    const date = isoToDate(day)
    return db.leaveRequest.groupBy({
      by: ['status'],
      where: {
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: date },
        endDate: { gte: date },
        user: teamMemberFilter(scope),
      },
      _count: { _all: true },
    })
  },
}
