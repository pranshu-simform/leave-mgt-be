import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { Role } from '@/generated/prisma/enums'
import { prisma } from '@/prisma/client'
import { balanceRepository } from '@/modules/balances/balance.repository'
import type { BalanceDto } from '@/modules/balances/balance.types'
import { findUserById } from '@/modules/users'

export function allocateYear(year: number): Promise<number> {
  return balanceRepository.allocateYear(prisma, year)
}

export async function getBalances(userId: string, year: number): Promise<BalanceDto[]> {
  const rows = await balanceRepository.findByUserAndYear(prisma, userId, year)
  return rows.map((row) => ({
    leaveTypeId: row.leaveType.id,
    code: row.leaveType.code,
    name: row.leaveType.name,
    year: row.year,
    allowance: row.allowance,
    used: row.used,
    remaining: row.allowance - row.used,
  }))
}

export async function getBalancesForUser(
  actor: { id: string; role: Role },
  targetUserId: string,
  year: number,
): Promise<BalanceDto[]> {
  const allowed = actor.id === targetUserId || actor.role === Role.HR_ADMIN
  if (!allowed || !(await findUserById(targetUserId))) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'User not found')
  }
  return getBalances(targetUserId, year)
}
