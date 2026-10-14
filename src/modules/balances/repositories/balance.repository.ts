import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'
import { MAX_BALANCES, MAX_DRIFT_ROWS } from '@/modules/balances/constants/balance.constants'
import type {
  AdjustBalanceData,
  BalanceKey,
  DriftRow,
  LedgerEntryData,
  NewBalanceData,
} from '@/modules/balances/types/balance.types'

export const balanceRepository = {
  deduct: async (db: Db, { userId, leaveTypeId, year, days }: BalanceKey) => {
    const rows = await db.leaveBalance.updateManyAndReturn({
      where: { userId, leaveTypeId, year },
      data: { used: { increment: days } },
      select: { id: true },
    })
    return rows[0]?.id ?? null
  },

  refund: async (db: Db, { userId, leaveTypeId, year, days }: BalanceKey) => {
    const rows = await db.leaveBalance.updateManyAndReturn({
      where: { userId, leaveTypeId, year, used: { gte: days } },
      data: { used: { decrement: days } },
      select: { id: true },
    })
    return rows[0]?.id ?? null
  },

  adjust: async (db: Db, { userId, leaveTypeId, year, delta }: AdjustBalanceData) => {
    const rows = await db.leaveBalance.updateManyAndReturn({
      where: { userId, leaveTypeId, year },
      data: { allowance: { increment: delta } },
      select: { id: true },
    })
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
      include: { leaveType: { select: { id: true, name: true } } },
      orderBy: [{ leaveType: { name: 'asc' } }, { leaveTypeId: 'asc' }],
      take: MAX_BALANCES,
    }),

  findBalanceTypes: (db: Db) =>
    db.leaveType.findMany({
      where: { isActive: true, drawsFromBalance: true },
      select: { id: true, defaultAllowanceDays: true },
      orderBy: { id: 'asc' },
      take: MAX_BALANCES,
    }),

  findActiveUserIds: (db: Db, take: number, after: string | null, userId: string | null) =>
    db.user.findMany({
      where: {
        isActive: true,
        id: { equals: userId ?? undefined, gt: after ?? undefined },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
      take,
    }),

  createBalances: (db: Db, data: NewBalanceData[]) =>
    db.leaveBalance.createManyAndReturn({
      data,
      skipDuplicates: true,
      select: { id: true, allowance: true },
    }),

  addLedgerEntries: (db: Db, data: LedgerEntryData[]) => db.leaveBalanceLedger.createMany({ data }),

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
        c.leave_type_id, t.name AS leave_type_name,
        c.allowance, c.expected_allowance, c.used, c.expected_used,
        (COUNT(*) OVER ())::int AS drift_total
      FROM computed c
      JOIN users u ON u.id = c.user_id
      JOIN leave_types t ON t.id = c.leave_type_id
      WHERE c.allowance <> c.expected_allowance OR c.used <> c.expected_used
      ORDER BY u.name, t.name, c.id
      LIMIT ${MAX_DRIFT_ROWS}::int`,
}
