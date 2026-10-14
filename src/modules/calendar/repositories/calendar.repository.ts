import { Prisma } from '@/generated/prisma/client'
import type { Db } from '@/prisma/client'
import {
  CALENDAR_REQUEST_SELECT,
  MAX_OVERLAPPING,
  MAX_PEAK_ROWS,
  MAX_TEAMS,
  TEAM_SELECT,
} from '@/modules/calendar/constants/calendar.constants'
import type {
  CalendarFilter,
  OverlapKey,
  SummaryFilter,
  SummaryRow,
  TotalRow,
} from '@/modules/calendar/types/calendar.types'
import { calendarRequestWhere, weekdays } from '@/modules/calendar/utils/calendar.queries'

export const calendarRepository = {
  findOverlapping: (db: Db, { managerId, userId, from, to }: OverlapKey) =>
    db.leaveRequest.findMany({
      where: {
        ...calendarRequestWhere({ managerId, from, to }),
        userId: { not: userId },
      },
      select: CALENDAR_REQUEST_SELECT,
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      take: MAX_OVERLAPPING,
    }),

  findTeamRanges: (db: Db, { managerId, userId, from, to }: OverlapKey) =>
    db.leaveRequest.findMany({
      where: {
        ...calendarRequestWhere({ managerId, from, to }),
        userId: { not: userId },
      },
      select: { startDate: true, endDate: true },
      take: MAX_PEAK_ROWS,
    }),

  // Teams HR can look at: managers with at least one active report. A small reference list, capped.
  findTeams: (db: Db) =>
    db.user.findMany({
      where: { isActive: true, reports: { some: { isActive: true } } },
      select: TEAM_SELECT,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: MAX_TEAMS,
    }),

  teamSize: (db: Db, managerId: string) => db.user.count({ where: { managerId, isActive: true } }),

  findInMonth: async (db: Db, filter: CalendarFilter, skip: number, take: number) => {
    const where = calendarRequestWhere(filter)
    const [items, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        select: CALENDAR_REQUEST_SELECT,
        orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      db.leaveRequest.count({ where }),
    ])
    return { items, total }
  },

  // Raw SQL: the heatmap groups by generated weekdays and probes the range GiST index per day.
  summarize: async (db: Db, { managerId, from, to }: SummaryFilter, skip: number, take: number) => {
    const source = Prisma.sql`
      FROM (${weekdays({ from, to })}) days
      JOIN leave_requests r ON r.status IN ('PENDING', 'APPROVED')
        AND daterange(r.start_date, r.end_date, '[]') @> days.day
      JOIN users u ON u.id = r.user_id AND u.is_active
        ${managerId ? Prisma.sql`AND u.manager_id = ${managerId}::uuid` : Prisma.empty}
      JOIN users lead ON lead.id = u.manager_id`
    const [items, counts] = await Promise.all([
      db.$queryRaw<SummaryRow[]>`
        WITH page AS (
          SELECT days.day, lead.id AS manager_id, lead.name AS manager_name,
            count(*) FILTER (WHERE r.status = 'PENDING')::int AS pending,
            count(*) FILTER (WHERE r.status = 'APPROVED')::int AS approved
          ${source}
          GROUP BY days.day, lead.id, lead.name
          ORDER BY days.day, lead.id
          LIMIT ${take} OFFSET ${skip}
        )
        SELECT to_char(p.day, 'YYYY-MM-DD') AS date, p.manager_id AS "managerId", p.manager_name AS "managerName",
          (SELECT count(*)::int FROM users m WHERE m.manager_id = p.manager_id AND m.is_active) AS "teamSize",
          p.pending, p.approved
        FROM page p
        ORDER BY p.day, p.manager_id`,
      db.$queryRaw<TotalRow[]>`
        SELECT count(*)::int AS total FROM (
          SELECT 1 ${source} GROUP BY days.day, lead.id
        ) g`,
    ])
    return { items, total: counts[0]?.total ?? 0 }
  },
}
