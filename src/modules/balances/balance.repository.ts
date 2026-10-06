import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'

const MAX_BALANCES = 100

export const balanceRepository = {
  findOne: (db: Db, userId: string, leaveTypeId: string, year: number) =>
    db.leaveBalance.findUnique({
      where: { userId_leaveTypeId_year: { userId, leaveTypeId, year } },
    }),

  pendingDaysByType: async (db: Db, userId: string, year: number) => {
    const rows = await db.leaveRequest.groupBy({
      by: ['leaveTypeId'],
      where: {
        userId,
        status: 'PENDING',
        startDate: {
          gte: isoToDate(`${year}-01-01`),
          lte: isoToDate(`${year}-12-31`),
        },
      },
      _sum: { days: true },
    })
    return new Map(rows.map((row) => [row.leaveTypeId, row._sum.days ?? 0]))
  },

  findByUserAndYear: (db: Db, userId: string, year: number) =>
    db.leaveBalance.findMany({
      where: { userId, year },
      include: { leaveType: { select: { id: true, code: true, name: true } } },
      orderBy: { leaveType: { code: 'asc' } },
      take: MAX_BALANCES,
    }),

  // One statement: a balance for every active user x active balance-drawing leave type, and an
  // ALLOCATION ledger row only for the balances this call actually inserted. A rerun, or a
  // concurrent run, inserts nothing twice because of the unique key and ON CONFLICT DO NOTHING.
  allocateYear: (db: Db, year: number): Promise<number> =>
    db.$executeRaw`
      WITH inserted AS (
        INSERT INTO leave_balances (id, user_id, leave_type_id, year, allowance, used, created_at, updated_at)
        SELECT gen_random_uuid(), u.id, t.id, ${year}::int, t.default_allowance_days, 0, now(), now()
        FROM users u
        CROSS JOIN leave_types t
        WHERE u.is_active AND t.is_active AND t.draws_from_balance
        ON CONFLICT (user_id, leave_type_id, year) DO NOTHING
        RETURNING id, allowance
      )
      INSERT INTO leave_balance_ledger (id, balance_id, delta, reason, created_at)
      SELECT gen_random_uuid(), id, allowance, 'ALLOCATION', now()
      FROM inserted`,
}
