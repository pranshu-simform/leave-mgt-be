import { Role } from '@/generated/prisma/enums'
import type { DashboardActor, TeamScope } from '@/modules/dashboard/types/dashboard.types'

// A manager's team is their direct reports; HR looks at everyone. An employee has no team panel.
export function resolveTeamScope(actor: DashboardActor): TeamScope | null {
  if (actor.role === Role.MANAGER) return { managerId: actor.id, viewerId: actor.id }
  if (actor.role === Role.HR_ADMIN) return { managerId: null, viewerId: actor.id }
  return null
}
