import type { DriftDto, DriftRow, NewBalanceData } from '@/modules/balances/types/balance.types'

export function toDriftDto(row: DriftRow): DriftDto {
  return {
    balanceId: row.balance_id,
    user: { id: row.user_id, name: row.user_name },
    leaveType: { id: row.leave_type_id, name: row.leave_type_name },
    allowance: row.allowance,
    expectedAllowance: row.expected_allowance,
    used: row.used,
    expectedUsed: row.expected_used,
  }
}

export function toNewBalances(
  users: readonly { id: string }[],
  types: readonly { id: string; defaultAllowanceDays: number }[],
  year: number,
): NewBalanceData[] {
  return users.flatMap((user) =>
    types.map((type) => ({
      userId: user.id,
      leaveTypeId: type.id,
      year,
      allowance: type.defaultAllowanceDays,
    })),
  )
}
