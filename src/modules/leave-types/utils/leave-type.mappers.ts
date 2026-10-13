import type { LeaveType } from '@/generated/prisma/client'
import type { AdminLeaveTypeDto, LeaveTypeDto } from '@/modules/leave-types/types/leave-type.types'

export function toLeaveTypeDto(type: LeaveType): LeaveTypeDto {
  return {
    id: type.id,
    code: type.code,
    name: type.name,
    drawsFromBalance: type.drawsFromBalance,
    defaultAllowanceDays: type.defaultAllowanceDays,
    allowRetroactive: type.allowRetroactive,
    minNoticeDays: type.minNoticeDays,
    maxConsecutiveDays: type.maxConsecutiveDays,
    requiresNote: type.requiresNote,
  }
}

export function toAdminLeaveTypeDto(type: LeaveType): AdminLeaveTypeDto {
  return {
    ...toLeaveTypeDto(type),
    requiresApproval: type.requiresApproval,
    isActive: type.isActive,
  }
}
