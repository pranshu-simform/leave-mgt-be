import type { z } from 'zod'
import type { Role } from '@/generated/prisma/enums'
import type {
  calendarQuerySchema,
  summaryQuerySchema,
} from '@/modules/calendar/schemas/calendar.schema'

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

export interface AbsenceRow {
  requestId: string
  userId: string
  name: string
  typeCode: string
  typeName: string
  startDate: string
  endDate: string
  status: CalendarStatus
}

export interface TeamRow {
  managerId: string
  managerName: string
  teamSize: number
}

export interface SummaryRow {
  date: string
  managerId: string
  managerName: string
  teamSize: number
  pending: number
  approved: number
}

export interface DateWindow {
  from: string
  to: string
}

export interface CalendarFilter extends DateWindow {
  managerId: string | null
  status?: CalendarStatus
}

export interface OverlapKey extends DateWindow {
  managerId: string
  userId: string
}

export interface SummaryFilter extends DateWindow {
  managerId: string | null
}

export interface PeakRow {
  peak: number
}

export interface SizeRow {
  size: number
}

export interface TotalRow {
  total: number
}

export interface CalendarActor {
  id: string
  role: Role
  managerId: string | null
}

export interface OverlapRequester {
  id: string
  managerId: string | null
}

export type CalendarQuery = z.infer<typeof calendarQuerySchema>
export type SummaryQuery = z.infer<typeof summaryQuerySchema>
