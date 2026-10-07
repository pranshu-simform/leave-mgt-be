import type { ErrorCode } from '@/common/errors/errorCodes'
import type { LeaveType } from '@/generated/prisma/client'

export interface LeaveTypeDto {
  id: string
  code: string
  name: string
  drawsFromBalance: boolean
  defaultAllowanceDays: number
  allowRetroactive: boolean
  minNoticeDays: number
  maxConsecutiveDays: number | null
  requiresNote: boolean
}

export type LeaveRuleCode = Extract<
  ErrorCode,
  'RETROACTIVE_NOT_ALLOWED' | 'NOTICE_TOO_SHORT' | 'MAX_DAYS_EXCEEDED' | 'NOTE_REQUIRED'
>

export interface LeaveRuleViolation {
  code: LeaveRuleCode
  field: string
  message: string
}

export interface LeaveRuleInput {
  startDate: string
  days: number
  note?: string | null
  today: string
}

export type LeaveRuleType = Pick<
  LeaveType,
  'allowRetroactive' | 'minNoticeDays' | 'maxConsecutiveDays' | 'requiresNote'
>
