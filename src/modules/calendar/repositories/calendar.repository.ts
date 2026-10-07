import { Prisma } from '@/generated/prisma/client'
import type { Db } from '@/prisma/client'
import { MAX_OVERLAPPING, MAX_TEAMS } from '@/modules/calendar/constants/calendar.constants'
import type {
  AbsenceRow,
  CalendarFilter,
  OverlapKey,
  PeakRow,
  SizeRow,
  SummaryFilter,
  SummaryRow,
  TeamRow,
  TotalRow,
} from '@/modules/calendar/types/calendar.types'
import { calendarWhere, weekdays } from '@/modules/calendar/utils/calendar.queries'

export const calendarRepository = {
  findOverlapping: (db: Db, { managerId, userId, from, to }: OverlapKey) =>
    db.$queryRaw<AbsenceRow[]>`
      SELECT r.id AS "requestId", u.id AS "userId", u.name,
        lt.code AS "typeCode", lt.name AS "typeName",
        to_char(r.start_date, 'YYYY-MM-DD') AS "startDate",
        to_char(r.end_date, 'YYYY-MM-DD') AS "endDate",
        r.status::text AS status
      FROM leave_requests r
      JOIN users u ON u.id = r.user_id
      JOIN leave_types lt ON lt.id = r.leave_type_id
      WHERE ${calendarWhere({ managerId, from, to })} AND u.id <> ${userId}::uuid
      ORDER BY r.start_date, r.id
      LIMIT ${MAX_OVERLAPPING}`,

  peakConcurrent: async (db: Db, { managerId, userId, from, to }: OverlapKey) => {
    const rows = await db.$queryRaw<PeakRow[]>`
      WITH others AS (
        SELECT r.start_date, r.end_date
        FROM leave_requests r
        JOIN users u ON u.id = r.user_id
        WHERE ${calendarWhere({ managerId, from, to })} AND u.id <> ${userId}::uuid
      ), per_day AS (
        SELECT days.day, count(o.start_date) AS n
        FROM (${weekdays({ from, to })}) days
        LEFT JOIN others o ON o.start_date <= days.day AND o.end_date >= days.day
        GROUP BY days.day
      )
      SELECT coalesce(max(n) + 1, 0)::int AS peak FROM per_day`
    return rows[0]?.peak ?? 0
  },

  // Teams HR can look at: managers with at least one active report. A small reference list, capped.
  findTeams: (db: Db) =>
    db.$queryRaw<TeamRow[]>`
      SELECT m.id AS "managerId", m.name AS "managerName", count(*)::int AS "teamSize"
      FROM users u
      JOIN users m ON m.id = u.manager_id AND m.is_active
      WHERE u.is_active
      GROUP BY m.id, m.name
      ORDER BY m.name, m.id
      LIMIT ${MAX_TEAMS}`,

  teamSize: async (db: Db, managerId: string) => {
    const rows = await db.$queryRaw<SizeRow[]>`
      SELECT count(*)::int AS size FROM users WHERE manager_id = ${managerId}::uuid AND is_active`
    return rows[0]?.size ?? 0
  },

  findInMonth: async (db: Db, filter: CalendarFilter, skip: number, take: number) => {
    const where = calendarWhere(filter)
    const [items, counts] = await Promise.all([
      db.$queryRaw<AbsenceRow[]>`
        SELECT r.id AS "requestId", u.id AS "userId", u.name,
          lt.code AS "typeCode", lt.name AS "typeName",
          to_char(r.start_date, 'YYYY-MM-DD') AS "startDate",
          to_char(r.end_date, 'YYYY-MM-DD') AS "endDate",
          r.status::text AS status
        FROM leave_requests r
        JOIN users u ON u.id = r.user_id
        JOIN leave_types lt ON lt.id = r.leave_type_id
        WHERE ${where}
        ORDER BY r.start_date, r.id
        LIMIT ${take} OFFSET ${skip}`,
      db.$queryRaw<TotalRow[]>`
        SELECT count(*)::int AS total
        FROM leave_requests r
        JOIN users u ON u.id = r.user_id
        WHERE ${where}`,
    ])
    return { items, total: counts[0]?.total ?? 0 }
  },

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
