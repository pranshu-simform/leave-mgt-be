import { Prisma } from '@/generated/prisma/client'
import type { TeamScope } from '@/modules/dashboard/types/dashboard.types'

export function teamMemberWhere({ managerId, viewerId }: TeamScope) {
  return Prisma.sql`u.is_active AND u.id <> ${viewerId}::uuid
    ${managerId ? Prisma.sql`AND u.manager_id = ${managerId}::uuid` : Prisma.empty}`
}

export function yearBounds(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}
