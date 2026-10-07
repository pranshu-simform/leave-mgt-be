import type { AbsenceItem, AbsenceRow } from '@/modules/calendar/types/calendar.types'

export function toItem(row: AbsenceRow): AbsenceItem {
  return {
    requestId: row.requestId,
    userId: row.userId,
    name: row.name,
    leaveType: { code: row.typeCode, name: row.typeName },
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
  }
}
