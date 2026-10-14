import { dateToIso } from '@/common/utils/dates'
import type { LeaveEmailData } from '@/modules/email'
import type {
  LeaveRequestDto,
  LeaveRequestRow,
} from '@/modules/leave-requests/types/leave-request.types'

export function toLeaveEmailData(row: LeaveRequestRow): LeaveEmailData {
  return {
    requestId: row.id,
    employeeId: row.userId,
    employeeName: row.user.name,
    managerId: row.user.managerId,
    leaveTypeName: row.leaveType.name,
    drawsFromBalance: row.leaveType.drawsFromBalance,
    startDate: dateToIso(row.startDate),
    endDate: dateToIso(row.endDate),
    days: row.days,
    note: row.note,
  }
}

export function toDto(row: LeaveRequestRow): LeaveRequestDto {
  return {
    id: row.id,
    leaveType: {
      id: row.leaveType.id,
      name: row.leaveType.name,
    },
    startDate: dateToIso(row.startDate),
    endDate: dateToIso(row.endDate),
    days: row.days,
    note: row.note,
    status: row.status,
    requester: { id: row.user.id, name: row.user.name },
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}
