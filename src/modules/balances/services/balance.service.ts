import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { prisma, type Db } from '@/prisma/client'
import { balanceRepository } from '@/modules/balances/repositories/balance.repository'
import type {
  BalanceActor,
  BalanceChange,
  BalanceDto,
} from '@/modules/balances/types/balance.types'
import { findUserInReadScope } from '@/modules/users'

export function allocateYear(year: number): Promise<number> {
  return balanceRepository.allocateYear(prisma, year)
}

export function findBalance(userId: string, leaveTypeId: string, year: number) {
  return balanceRepository.findOne(prisma, userId, leaveTypeId, year)
}

export async function getBalances(userId: string, year: number): Promise<BalanceDto[]> {
  const [rows, pending] = await Promise.all([
    balanceRepository.findByUserAndYear(prisma, userId, year),
    balanceRepository.pendingDaysByType(prisma, userId, year),
  ])
  return rows.map((row) => ({
    leaveTypeId: row.leaveType.id,
    code: row.leaveType.code,
    name: row.leaveType.name,
    year: row.year,
    allowance: row.allowance,
    used: row.used,
    remaining: row.allowance - row.used,
    pendingDays: pending.get(row.leaveTypeId) ?? 0,
  }))
}

export async function deductBalance(tx: Db, change: BalanceChange): Promise<void> {
  const balanceId = await balanceRepository.deduct(tx, change)
  if (!balanceId) {
    throw new AppError(
      ERROR_CODES.INSUFFICIENT_BALANCE,
      422,
      'Not enough leave balance to approve this request',
    )
  }
  await balanceRepository.addLedgerEntry(tx, {
    balanceId,
    delta: -change.days,
    reason: 'DEDUCT',
    requestId: change.requestId,
    actorId: change.actorId,
  })
}

export async function refundBalance(tx: Db, change: BalanceChange): Promise<void> {
  const balanceId = await balanceRepository.refund(tx, change)
  if (!balanceId) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, 'The balance could not be refunded')
  }
  await balanceRepository.addLedgerEntry(tx, {
    balanceId,
    delta: change.days,
    reason: 'REFUND',
    requestId: change.requestId,
    actorId: change.actorId,
  })
}

export async function getBalancesForUser(
  actor: BalanceActor,
  targetUserId: string,
  year: number,
): Promise<BalanceDto[]> {
  if (!(await findUserInReadScope(actor, targetUserId))) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'User not found')
  }
  return getBalances(targetUserId, year)
}
