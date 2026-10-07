import { diffDays } from '@/common/utils/dates'
import type {
  LeaveRuleInput,
  LeaveRuleType,
  LeaveRuleViolation,
} from '@/modules/leave-types/types/leave-type.types'

export function evaluateLeaveRules(
  type: LeaveRuleType,
  { startDate, days, note, today }: LeaveRuleInput,
): LeaveRuleViolation[] {
  const violations: LeaveRuleViolation[] = []
  const noticeDays = diffDays(today, startDate)

  if (noticeDays < 0) {
    if (!type.allowRetroactive) {
      violations.push({
        code: 'RETROACTIVE_NOT_ALLOWED',
        field: 'startDate',
        message: 'This leave type cannot start in the past',
      })
    }
  } else if (noticeDays < type.minNoticeDays) {
    violations.push({
      code: 'NOTICE_TOO_SHORT',
      field: 'startDate',
      message: `This leave type needs at least ${type.minNoticeDays} days notice`,
    })
  }

  if (type.maxConsecutiveDays !== null && days > type.maxConsecutiveDays) {
    violations.push({
      code: 'MAX_DAYS_EXCEEDED',
      field: 'endDate',
      message: `This leave type allows at most ${type.maxConsecutiveDays} working days at once`,
    })
  }

  if (type.requiresNote && !note?.trim()) {
    violations.push({
      code: 'NOTE_REQUIRED',
      field: 'note',
      message: 'A note is required for this leave type',
    })
  }

  return violations
}
