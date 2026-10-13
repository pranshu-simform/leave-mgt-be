import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { prisma, withTransaction, type Db } from '@/prisma/client'
import { balanceRepository } from '@/modules/balances/repositories/balance.repository'
import type {
  AdjustBalanceData,
  AllocationResult,
  BalanceActor,
  BalanceChange,
  BalanceDto,
  ReconcileReportDto,
} from '@/modules/balances/types/balance.types'
import { toDriftDto } from '@/modules/balances/utils/balance.mappers'
import { findUserById, findUserInReadScope } from '@/modules/users'

export function allocateYear(
  year: number,
  db: Db = prisma,
  actorId: string | null = null,
): Promise<number> {
  return balanceRepository.allocateYear(db, year, actorId)
}

export function allocateUserYear(
  userId: string,
  year: number,
  db: Db,
  actorId: string | null,
): Promise<number> {
  return balanceRepository.allocateYear(db, year, actorId, userId)
}

export async function allocateBalances(
  actor: BalanceActor,
  year: number,
): Promise<AllocationResult> {
  return { year, created: await allocateYear(year, prisma, actor.id) }
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

// A miss means there is no such balance, or the change would drop the allowance below the days
// already used (or a concurrent change moved the balance after the guarded UPDATE looked at it).
async function explainAdjustMiss(db: Db, change: AdjustBalanceData): Promise<never> {
  const balance = await balanceRepository.findOne(
    db,
    change.userId,
    change.leaveTypeId,
    change.year,
  )
  if (!balance) {
    const user = await findUserById(change.userId)
    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      404,
      user ? 'No balance found for this person, leave type and year' : 'User not found',
    )
  }
  if (balance.allowance + change.delta >= balance.used) {
    throw new AppError(ERROR_CODES.VERSION_CONFLICT, 409, 'The balance just changed. Try again')
  }
  throw new AppError(
    ERROR_CODES.INSUFFICIENT_BALANCE,
    422,
    `Cannot remove ${-change.delta} days: ${balance.used} of ${balance.allowance} are used, so at most ${balance.allowance - balance.used} can be removed`,
  )
}

export async function adjustBalance(
  actor: BalanceActor,
  change: AdjustBalanceData,
): Promise<BalanceDto> {
  await withTransaction(async (tx) => {
    const balanceId = await balanceRepository.adjust(tx, change)
    if (!balanceId) return explainAdjustMiss(tx, change)
    await balanceRepository.addLedgerEntry(tx, {
      balanceId,
      delta: change.delta,
      reason: 'ADJUSTMENT',
      actorId: actor.id,
      note: change.note,
    })
  })
  const balances = await getBalances(change.userId, change.year)
  const updated = balances.find((balance) => balance.leaveTypeId === change.leaveTypeId)
  if (!updated) throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, 'The balance was not found')
  return updated
}

export async function reconcileBalances(year: number): Promise<ReconcileReportDto> {
  const [rows, checked] = await Promise.all([
    balanceRepository.findDrift(prisma, year),
    balanceRepository.countByYear(prisma, year),
  ])
  return {
    year,
    checked,
    driftCount: rows[0]?.drift_total ?? 0,
    drifts: rows.map(toDriftDto),
  }
}
