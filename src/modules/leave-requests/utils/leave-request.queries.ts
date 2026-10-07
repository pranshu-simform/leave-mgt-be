import type { Prisma } from '@/generated/prisma/client'
import { isoToDate } from '@/common/utils/dates'
import type { ListFilters, ScopeActor } from '@/modules/leave-requests/types/leave-request.types'

export function approverScope(actor: ScopeActor): Prisma.UserWhereInput {
  return actor.role === 'HR_ADMIN'
    ? { id: { not: actor.id } }
    : { managerId: actor.id, id: { not: actor.id } }
}

export function readScope(actor: ScopeActor): Prisma.LeaveRequestWhereInput {
  return actor.role === 'HR_ADMIN'
    ? {}
    : { OR: [{ userId: actor.id }, { user: { managerId: actor.id } }] }
}

export function listWhere({
  userId,
  status,
  year,
  leaveTypeId,
  from,
}: ListFilters): Prisma.LeaveRequestWhereInput {
  return {
    userId,
    ...(status ? { status } : {}),
    ...(leaveTypeId ? { leaveTypeId } : {}),
    ...(from ? { endDate: { gte: isoToDate(from) } } : {}),
    ...(year
      ? {
          startDate: {
            gte: isoToDate(`${year}-01-01`),
            lte: isoToDate(`${year}-12-31`),
          },
        }
      : {}),
  }
}
