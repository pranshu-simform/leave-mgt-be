import type { LeaveStatus } from '@/generated/prisma/enums'
import type { StatusCount, TeamDay } from '@/modules/dashboard/types/dashboard.types'

export function toTeamDay(date: string, rows: readonly StatusCount[]): TeamDay {
  const count = (status: LeaveStatus) => rows.find((row) => row.status === status)?._count._all ?? 0
  return { date, approved: count('APPROVED'), pending: count('PENDING') }
}
