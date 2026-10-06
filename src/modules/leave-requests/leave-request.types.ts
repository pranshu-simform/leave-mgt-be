import type { ErrorCode } from '@/common/errors/errorCodes'
import type { LeaveStatus } from '@/generated/prisma/enums'

export interface LeaveRequestDto {
  id: string
  leaveType: { id: string; code: string; name: string }
  startDate: string
  endDate: string
  days: number
  note: string | null
  status: LeaveStatus
  version: number
  requester: { id: string; name: string }
  decidedAt: string | null
  createdAt: string
}

export type RequestViolationCode = Extract<
  ErrorCode,
  | 'CROSS_YEAR_RANGE'
  | 'NO_WORKING_DAYS'
  | 'RETROACTIVE_NOT_ALLOWED'
  | 'NOTICE_TOO_SHORT'
  | 'MAX_DAYS_EXCEEDED'
  | 'NOTE_REQUIRED'
  | 'INSUFFICIENT_BALANCE'
>

export interface RequestViolation {
  code: RequestViolationCode
  field: string
  message: string
}

export interface RequestCheck {
  days: number
  violations: RequestViolation[]
  balance: { allowance: number; used: number; remaining: number; remainingAfter: number } | null
}
