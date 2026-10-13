import type { z } from 'zod'
import type { Role } from '@/generated/prisma/enums'
import type { dashboardQuerySchema } from '@/modules/dashboard/schemas/dashboard.schema'

export interface MonthlyDays {
  month: string
  leaveTypeId: string
  name: string
  days: number
}

export interface TeamDay {
  date: string
  approved: number
  pending: number
}

export interface TeamStats {
  teamSize: number
  awayToday: number
  days: TeamDay[]
}

export interface DashboardStatsDto {
  year: number
  monthly: MonthlyDays[]
  team: TeamStats | null
}

export interface DashboardActor {
  id: string
  role: Role
}

// Whose leave the team panel counts: one manager's direct reports, or everyone (managerId null).
// The viewer is never counted.
export interface TeamScope {
  managerId: string | null
  viewerId: string
}

export interface MonthlyFilter {
  userId: string
  from: string
  to: string
}

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>
