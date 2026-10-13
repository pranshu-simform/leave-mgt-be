import { dateToIso } from '@/common/utils/dates'
import type {
  AbsenceItem,
  CalendarRequestRow,
  CalendarStatus,
  DateWindow,
  TeamDto,
  TeamRow,
} from '@/modules/calendar/types/calendar.types'

export function toItem(row: CalendarRequestRow): AbsenceItem {
  return {
    requestId: row.id,
    userId: row.user.id,
    name: row.user.name,
    leaveType: row.leaveType,
    startDate: dateToIso(row.startDate),
    endDate: dateToIso(row.endDate),
    status: row.status as CalendarStatus,
  }
}

export function toTeamDto(row: TeamRow): TeamDto {
  return {
    managerId: row.id,
    managerName: row.name,
    teamSize: row._count.reports,
  }
}

export function toRange(row: { startDate: Date; endDate: Date }): DateWindow {
  return { from: dateToIso(row.startDate), to: dateToIso(row.endDate) }
}
