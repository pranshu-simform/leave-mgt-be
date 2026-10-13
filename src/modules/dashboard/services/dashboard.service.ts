import { todayIso } from '@/common/utils/dates'
import { prisma } from '@/prisma/client'
import { dashboardRepository } from '@/modules/dashboard/repositories/dashboard.repository'
import type {
  DashboardActor,
  DashboardQuery,
  DashboardStatsDto,
  TeamScope,
  TeamStats,
} from '@/modules/dashboard/types/dashboard.types'
import { yearBounds } from '@/modules/dashboard/utils/dashboard.queries'
import { resolveTeamScope } from '@/modules/dashboard/utils/dashboard.scope'

export async function getDashboard(
  actor: DashboardActor,
  query: DashboardQuery,
): Promise<DashboardStatsDto> {
  const scope = resolveTeamScope(actor)
  const [monthly, team] = await Promise.all([
    dashboardRepository.monthly(prisma, { userId: actor.id, ...yearBounds(query.year) }),
    scope ? getTeamStats(scope) : null,
  ])
  return { year: query.year, monthly, team }
}

async function getTeamStats(scope: TeamScope): Promise<TeamStats> {
  const today = todayIso()
  const [teamSize, awayToday, days] = await Promise.all([
    dashboardRepository.teamSize(prisma, scope),
    dashboardRepository.awayOn(prisma, scope, today),
    dashboardRepository.upcomingDays(prisma, scope, today),
  ])
  return { teamSize, awayToday, days }
}
