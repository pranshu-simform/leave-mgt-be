import type { z } from 'zod'
import type { Prisma } from '@/generated/prisma/client'
import type { Role } from '@/generated/prisma/enums'
import type {
  CALENDAR_REQUEST_SELECT,
  TEAM_SELECT,
} from '@/modules/calendar/constants/calendar.constants'
import type {
  calendarQuerySchema,
  summaryQuerySchema,
} from '@/modules/calendar/schemas/calendar.schema'

export type CalendarStatus = 'PENDING' | 'APPROVED'

export interface AbsenceItem {
  requestId: string
  userId: string
  name: string
  leaveType: { id: string; name: string }
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

export type CalendarRequestRow = Prisma.LeaveRequestGetPayload<{
  select: typeof CALENDAR_REQUEST_SELECT
}>

export type TeamRow = Prisma.UserGetPayload<{ select: typeof TEAM_SELECT }>

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
