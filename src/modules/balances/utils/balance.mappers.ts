import type { NewBalanceData } from '@/modules/balances/types/balance.types'

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
