import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { prisma, withTransaction, type Db } from '@/prisma/client'
import {
  ALLOCATION_BATCH_ROWS,
  ALLOCATION_TIMEOUT_MS,
} from '@/modules/balances/constants/balance.constants'
import { balanceRepository } from '@/modules/balances/repositories/balance.repository'
import type {
  AdjustBalanceData,
  AllocationResult,
  BalanceActor,
  BalanceChange,
  BalanceDto,
} from '@/modules/balances/types/balance.types'
import {
  insufficientBalance,
  isAmountsViolation,
  toDeductError,
} from '@/modules/balances/utils/balance.errors'
import { toNewBalances } from '@/modules/balances/utils/balance.mappers'
import { findUserById, findUserInReadScope } from '@/modules/users'

async function allocate(
  tx: Db,
  year: number,
  actorId: string | null,
  userId: string | null,
): Promise<number> {
  const types = await balanceRepository.findBalanceTypes(tx)
  if (types.length === 0) return 0
  const take = Math.max(1, Math.floor(ALLOCATION_BATCH_ROWS / types.length))
  let created = 0
  let after: string | null = null
  for (;;) {
    const users = await balanceRepository.findActiveUserIds(tx, take, after, userId)
    const balances = await balanceRepository.createBalances(tx, toNewBalances(users, types, year))
    if (balances.length > 0) {
      await balanceRepository.addLedgerEntries(
        tx,
        balances.map((balance) => ({
          balanceId: balance.id,
          delta: balance.allowance,
          reason: 'ALLOCATION',
          actorId,
        })),
      )
    }
    created += balances.length
    const last = users.at(-1)
    if (users.length < take || !last) return created
    after = last.id
  }
}

export function allocateYear(year: number, tx: Db, actorId: string | null = null): Promise<number> {
  return allocate(tx, year, actorId, null)
}

export function allocateUserYear(
  userId: string,
  year: number,
  tx: Db,
  actorId: string | null,
): Promise<number> {
  return allocate(tx, year, actorId, userId)
}

export async function allocateBalances(
  actor: BalanceActor,
  year: number,
): Promise<AllocationResult> {
  const created = await withTransaction((tx) => allocateYear(year, tx, actor.id), {
    timeout: ALLOCATION_TIMEOUT_MS,
  })
  return { year, created }
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
  const balanceId = await balanceRepository.deduct(tx, change).catch((err: unknown) => {
    throw toDeductError(err)
  })
  if (!balanceId) throw insufficientBalance()
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
  const adjusted = await withTransaction(async (tx) => {
    const balanceId = await balanceRepository.adjust(tx, change)
    if (!balanceId) return false
    await balanceRepository.addLedgerEntry(tx, {
      balanceId,
      delta: change.delta,
      reason: 'ADJUSTMENT',
      actorId: actor.id,
      note: change.note,
    })
    return true
  }).catch((err: unknown) => {
    if (isAmountsViolation(err)) return false
    throw err
  })
  if (!adjusted) await explainAdjustMiss(prisma, change)
  const balances = await getBalances(change.userId, change.year)
  const updated = balances.find((balance) => balance.leaveTypeId === change.leaveTypeId)
  if (!updated) throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, 'The balance was not found')
  return updated
}
