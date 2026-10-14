import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'
import { MAX_BALANCES } from '@/modules/balances/constants/balance.constants'
import type {
  AdjustBalanceData,
  BalanceKey,
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
}
