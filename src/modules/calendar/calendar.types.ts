export type CalendarStatus = 'PENDING' | 'APPROVED'

export interface AbsenceItem {
  requestId: string
  userId: string
  name: string
  leaveType: { code: string; name: string }
  startDate: string
  endDate: string
  status: CalendarStatus
}

export interface OverlapSummary {
  overlapping: AbsenceItem[]
  peakConcurrent: number
  teamSize: number
}

export interface SummaryDay {
  date: string
  managerId: string
  managerName: string
  teamSize: number
  pending: number
  approved: number
}

export interface TeamDto {
  managerId: string
  managerName: string
  teamSize: number
}
