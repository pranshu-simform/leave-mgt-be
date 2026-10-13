import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'
import {
  MAX_MONTHLY_ROWS,
  TEAM_DAYS,
  TEAM_WINDOW_DAYS,
} from '@/modules/dashboard/constants/dashboard.constants'
import type {
  MonthlyDays,
  MonthlyFilter,
  TeamDay,
  TeamScope,
} from '@/modules/dashboard/types/dashboard.types'
import { teamMemberFilter, teamMemberWhere } from '@/modules/dashboard/utils/dashboard.queries'

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

  // People away on each of the next working days from `from`, split by status. A person has at most
  // one active request per day (the overlap constraint), so counting requests counts people.
  upcomingDays: (db: Db, scope: TeamScope, from: string) =>
    db.$queryRaw<TeamDay[]>`
      WITH days AS (
        SELECT d.day::date AS day
        FROM generate_series(${from}::timestamp,
          ${from}::timestamp + make_interval(days => ${TEAM_WINDOW_DAYS}), interval '1 day') AS d(day)
        WHERE extract(isodow FROM d.day) < 6
          AND NOT EXISTS (SELECT 1 FROM public_holidays h WHERE h.date = d.day::date)
        ORDER BY 1
        LIMIT ${TEAM_DAYS}
      )
      SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
        count(r.id) FILTER (WHERE r.status = 'APPROVED')::int AS approved,
        count(r.id) FILTER (WHERE r.status = 'PENDING')::int AS pending
      FROM days
      LEFT JOIN (leave_requests r JOIN users u ON u.id = r.user_id AND ${teamMemberWhere(scope)})
        ON r.status IN ('PENDING', 'APPROVED')
        AND daterange(r.start_date, r.end_date, '[]') @> days.day
      GROUP BY days.day
      ORDER BY days.day`,
}
