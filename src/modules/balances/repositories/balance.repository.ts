import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'
import { MAX_BALANCES, MAX_DRIFT_ROWS } from '@/modules/balances/constants/balance.constants'
import type {
  AdjustBalanceData,
  BalanceIdRow,
  BalanceKey,
  DriftRow,
  LedgerEntryData,
} from '@/modules/balances/types/balance.types'

export const balanceRepository = {
  deduct: async (db: Db, { userId, leaveTypeId, year, days }: BalanceKey) => {
    const rows = await db.$queryRaw<BalanceIdRow[]>`
      UPDATE leave_balances SET used = used + ${days}::int, updated_at = now()
      WHERE user_id = ${userId}::uuid AND leave_type_id = ${leaveTypeId}::uuid
        AND year = ${year}::int AND used + ${days}::int <= allowance
      RETURNING id`
    return rows[0]?.id ?? null
  },

  refund: async (db: Db, { userId, leaveTypeId, year, days }: BalanceKey) => {
    const rows = await db.$queryRaw<BalanceIdRow[]>`
      UPDATE leave_balances SET used = used - ${days}::int, updated_at = now()
      WHERE user_id = ${userId}::uuid AND leave_type_id = ${leaveTypeId}::uuid
        AND year = ${year}::int AND used - ${days}::int >= 0
      RETURNING id`
    return rows[0]?.id ?? null
  },

  // Moves the allowance, never below what is already used. The check is part of the UPDATE.
  adjust: async (db: Db, { userId, leaveTypeId, year, delta }: AdjustBalanceData) => {
    const rows = await db.$queryRaw<BalanceIdRow[]>`
      UPDATE leave_balances SET allowance = allowance + ${delta}::int, updated_at = now()
      WHERE user_id = ${userId}::uuid AND leave_type_id = ${leaveTypeId}::uuid
        AND year = ${year}::int AND allowance + ${delta}::int >= used
      RETURNING id`
    return rows[0]?.id ?? null
  },

  addLedgerEntry: (db: Db, data: LedgerEntryData) => db.leaveBalanceLedger.create({ data }),

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
  allocateYear: (db: Db, year: number, actorId: string | null): Promise<number> =>
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
      INSERT INTO leave_balance_ledger (id, balance_id, delta, reason, actor_id, created_at)
      SELECT gen_random_uuid(), id, allowance, 'ALLOCATION', ${actorId}::uuid, now()
      FROM inserted`,

  countByYear: (db: Db, year: number) => db.leaveBalance.count({ where: { year } }),

  // Recomputes every balance of a year from its ledger and returns the ones that disagree.
  // allowance = ALLOCATION + ADJUSTMENT deltas; used = minus the DEDUCT + REFUND deltas.
  // Read-only, capped at MAX_DRIFT_ROWS; drift_total is the real count of drifting balances.
  findDrift: (db: Db, year: number) =>
    db.$queryRaw<DriftRow[]>`
      WITH computed AS (
        SELECT b.id, b.user_id, b.leave_type_id, b.allowance, b.used,
          COALESCE(SUM(l.delta) FILTER (WHERE l.reason IN ('ALLOCATION', 'ADJUSTMENT')), 0)::int
            AS expected_allowance,
          (-COALESCE(SUM(l.delta) FILTER (WHERE l.reason IN ('DEDUCT', 'REFUND')), 0))::int
            AS expected_used
        FROM leave_balances b
        LEFT JOIN leave_balance_ledger l ON l.balance_id = b.id
        WHERE b.year = ${year}::int
        GROUP BY b.id
      )
      SELECT c.id AS balance_id, c.user_id, u.name AS user_name,
        c.leave_type_id, t.code AS leave_type_code, t.name AS leave_type_name,
        c.allowance, c.expected_allowance, c.used, c.expected_used,
        (COUNT(*) OVER ())::int AS drift_total
      FROM computed c
      JOIN users u ON u.id = c.user_id
      JOIN leave_types t ON t.id = c.leave_type_id
      WHERE c.allowance <> c.expected_allowance OR c.used <> c.expected_used
      ORDER BY u.name, t.code, c.id
      LIMIT ${MAX_DRIFT_ROWS}::int`,
}
