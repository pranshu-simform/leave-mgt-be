import { addDays, todayIso } from '@/common/utils/dates'
import { prisma } from '@/prisma/client'
import { getHolidayDates } from '@/modules/holidays'
import { TEAM_DAYS, TEAM_WINDOW_DAYS } from '@/modules/dashboard/constants/dashboard.constants'
import { dashboardRepository } from '@/modules/dashboard/repositories/dashboard.repository'
import type {
  DashboardActor,
  DashboardQuery,
  DashboardStatsDto,
  TeamDay,
  TeamScope,
  TeamStats,
} from '@/modules/dashboard/types/dashboard.types'
import { nextWorkingDays } from '@/modules/dashboard/utils/dashboard.days'
import { toTeamDay } from '@/modules/dashboard/utils/dashboard.mappers'
import { yearBounds } from '@/modules/dashboard/utils/dashboard.queries'
import { resolveTeamScope } from '@/modules/dashboard/utils/dashboard.scope'

export async function getDashboard(
  actor: DashboardActor,
  query: DashboardQuery,
): Promise<DashboardStatsDto> {
  const scope = resolveTeamScope(actor)
  const [monthly, team] = await Promise.all([
    dashboardRepository.monthly(prisma, {
      userId: actor.id,
      ...yearBounds(query.year),
    }),
    scope ? getTeamStats(scope) : null,
  ])
  return { year: query.year, monthly, team }
}

async function getTeamStats(scope: TeamScope): Promise<TeamStats> {
  const today = todayIso()
  const [teamSize, awayToday, days] = await Promise.all([
    dashboardRepository.teamSize(prisma, scope),
    dashboardRepository.awayOn(prisma, scope, today),
    upcomingDays(scope, today),
  ])
  return { teamSize, awayToday, days }
}

async function upcomingDays(scope: TeamScope, from: string): Promise<TeamDay[]> {
  const holidays = await getHolidayDates(from, addDays(from, TEAM_WINDOW_DAYS))
  const days = nextWorkingDays(from, TEAM_DAYS, TEAM_WINDOW_DAYS, new Set(holidays))
  const counts = await Promise.all(
    days.map((day) => dashboardRepository.statusCountsOn(prisma, scope, day)),
  )
  return days.map((day, index) => toTeamDay(day, counts[index] ?? []))
}
