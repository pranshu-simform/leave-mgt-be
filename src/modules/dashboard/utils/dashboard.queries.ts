import type { Prisma } from '@/generated/prisma/client'
import type { TeamScope } from '@/modules/dashboard/types/dashboard.types'

export function teamMemberFilter({ managerId, viewerId }: TeamScope): Prisma.UserWhereInput {
  return {
    isActive: true,
    id: { not: viewerId },
    ...(managerId ? { managerId } : {}),
  }
}

export function yearBounds(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}
