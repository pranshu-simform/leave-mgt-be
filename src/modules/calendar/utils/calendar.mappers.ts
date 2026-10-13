import type { AbsenceItem, AbsenceRow } from '@/modules/calendar/types/calendar.types'

export function toItem(row: AbsenceRow): AbsenceItem {
  return {
    requestId: row.requestId,
    userId: row.userId,
    name: row.name,
    leaveType: { id: row.typeId, name: row.typeName },
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
  }
}
