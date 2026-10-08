import type { Prisma } from '@/generated/prisma/client'
import { isoToDate } from '@/common/utils/dates'
import type {
  AdminListFilters,
  ListFilters,
  ScopeActor,
} from '@/modules/leave-requests/types/leave-request.types'

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

function filterWhere({
  status,
  year,
  leaveTypeId,
  from,
}: Omit<ListFilters, 'userId'>): Prisma.LeaveRequestWhereInput {
  return {
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

export function listWhere({ userId, ...filters }: ListFilters): Prisma.LeaveRequestWhereInput {
  return { userId, ...filterWhere(filters) }
}

// Every person's requests. Only HR reaches this (the admin router), so there is no scope.
export function adminListWhere({
  userId,
  ...filters
}: AdminListFilters): Prisma.LeaveRequestWhereInput {
  return { ...(userId ? { userId } : {}), ...filterWhere(filters) }
}
