import type { DriftDto, DriftRow } from '@/modules/balances/types/balance.types'

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
