import type { z } from 'zod'
import type { LedgerReason, Role } from '@/generated/prisma/enums'
import type { balanceQuerySchema } from '@/modules/balances/schemas/balance.schema'

export interface BalanceDto {
  leaveTypeId: string
  name: string
  year: number
  allowance: number
  used: number
  remaining: number
  pendingDays: number
}

export interface BalanceKey {
  userId: string
  leaveTypeId: string
  year: number
  days: number
}

export interface BalanceChange extends BalanceKey {
  requestId: string
  actorId: string | null
}

export interface LedgerEntryData {
  balanceId: string
  delta: number
  reason: LedgerReason
  requestId?: string
  actorId: string | null
  note?: string
}

export interface AdjustBalanceData {
  userId: string
  leaveTypeId: string
  year: number
  delta: number
  note: string
}

export interface NewBalanceData {
  userId: string
  leaveTypeId: string
  year: number
  allowance: number
}

export interface AllocationResult {
  year: number
  created: number
}

export interface BalanceActor {
  id: string
  role: Role
}

export type BalanceQuery = z.infer<typeof balanceQuerySchema>
