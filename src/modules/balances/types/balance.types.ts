import type { z } from 'zod'
import type { LedgerReason, Role } from '@/generated/prisma/enums'
import type { balanceQuerySchema } from '@/modules/balances/schemas/balance.schema'

export interface BalanceDto {
  leaveTypeId: string
  code: string
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

export interface AllocationResult {
  year: number
  created: number
}

// One drifting balance as the reconcile statement returns it (raw column names).
export interface DriftRow {
  balance_id: string
  user_id: string
  user_name: string
  leave_type_id: string
  leave_type_code: string
  leave_type_name: string
  allowance: number
  expected_allowance: number
  used: number
  expected_used: number
  drift_total: number
}

export interface DriftDto {
  balanceId: string
  user: { id: string; name: string }
  leaveType: { id: string; code: string; name: string }
  allowance: number
  expectedAllowance: number
  used: number
  expectedUsed: number
}

export interface ReconcileReportDto {
  year: number
  checked: number
  driftCount: number
  drifts: DriftDto[]
}

export interface BalanceIdRow {
  id: string
}

export interface BalanceActor {
  id: string
  role: Role
}

export type BalanceQuery = z.infer<typeof balanceQuerySchema>
