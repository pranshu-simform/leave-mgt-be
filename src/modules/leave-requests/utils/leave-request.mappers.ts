import { dateToIso } from '@/common/utils/dates'
import type {
  LeaveRequestDto,
  LeaveRequestRow,
} from '@/modules/leave-requests/types/leave-request.types'

export function toDto(row: LeaveRequestRow): LeaveRequestDto {
  return {
    id: row.id,
    leaveType: {
      id: row.leaveType.id,
      code: row.leaveType.code,
      name: row.leaveType.name,
    },
    startDate: dateToIso(row.startDate),
    endDate: dateToIso(row.endDate),
    days: row.days,
    note: row.note,
    status: row.status,
    version: row.version,
    requester: { id: row.user.id, name: row.user.name },
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }
}
