import type { Prisma } from '@/generated/prisma/client'
import type { EventAction, LeaveStatus, Role } from '@/generated/prisma/enums'
import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'

const withRelations = {
  leaveType: {
    select: { id: true, code: true, name: true, drawsFromBalance: true },
  },
  user: { select: { id: true, name: true, managerId: true } },
} as const

export type LeaveRequestRow = Prisma.LeaveRequestGetPayload<{
  include: typeof withRelations
}>

function approverScope(actor: { id: string; role: Role }): Prisma.UserWhereInput {
  return actor.role === 'HR_ADMIN'
    ? { id: { not: actor.id } }
    : { managerId: actor.id, id: { not: actor.id } }
}

interface ListFilters {
  userId: string
  status?: LeaveStatus
  year?: number
  leaveTypeId?: string
}

function listWhere({
  userId,
  status,
  year,
  leaveTypeId,
}: ListFilters): Prisma.LeaveRequestWhereInput {
  return {
    userId,
    ...(status ? { status } : {}),
    ...(leaveTypeId ? { leaveTypeId } : {}),
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

export const leaveRequestRepository = {
  create: (
    db: Db,
    data: {
      userId: string
      leaveTypeId: string
      startDate: string
      endDate: string
      days: number
      note: string | null
    },
  ) =>
    db.leaveRequest.create({
      data: {
        ...data,
        startDate: isoToDate(data.startDate),
        endDate: isoToDate(data.endDate),
      },
      include: withRelations,
    }),

  createEvent: (
    db: Db,
    data: {
      requestId: string
      actorId: string
      action: EventAction
      fromStatus: LeaveStatus | null
      toStatus: LeaveStatus
      reason?: string
      metadata?: Prisma.InputJsonValue
    },
  ) => db.leaveRequestEvent.create({ data }),

  findById: (db: Db, id: string) =>
    db.leaveRequest.findUnique({ where: { id }, include: withRelations }),

  findOwned: (db: Db, id: string, userId: string) =>
    db.leaveRequest.findFirst({
      where: { id, userId },
      include: withRelations,
    }),

  list: async (db: Db, filters: ListFilters, skip: number, take: number) => {
    const where = listWhere(filters)
    const [items, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: withRelations,
        orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
        skip,
        take,
      }),
      db.leaveRequest.count({ where }),
    ])
    return { items, total }
  },

  updateIfPending: async (
    db: Db,
    where: { id: string; userId: string; version: number },
    data: {
      startDate: string
      endDate: string
      days: number
      note: string | null
    },
  ) => {
    const result = await db.leaveRequest.updateMany({
      where: { ...where, status: 'PENDING' },
      data: {
        ...data,
        startDate: isoToDate(data.startDate),
        endDate: isoToDate(data.endDate),
        version: { increment: 1 },
      },
    })
    return result.count === 1
  },

  cancelIfPending: async (db: Db, where: { id: string; userId: string }) => {
    const result = await db.leaveRequest.updateMany({
      where: { ...where, status: 'PENDING' },
      data: { status: 'CANCELLED', version: { increment: 1 } },
    })
    return result.count === 1
  },

  findInApproverScope: (db: Db, id: string, actor: { id: string; role: Role }) =>
    db.leaveRequest.findFirst({
      where: { id, user: approverScope(actor) },
      include: withRelations,
    }),

  listForApprover: async (
    db: Db,
    actor: { id: string; role: Role },
    status: LeaveStatus,
    skip: number,
    take: number,
  ) => {
    const where: Prisma.LeaveRequestWhereInput = {
      status,
      user: approverScope(actor),
    }
    const [items, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: withRelations,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      db.leaveRequest.count({ where }),
    ])
    return { items, total }
  },

  decideIfPending: async (
    db: Db,
    id: string,
    actor: { id: string; role: Role },
    status: 'APPROVED' | 'REJECTED',
  ) => {
    const result = await db.leaveRequest.updateMany({
      where: { id, status: 'PENDING', user: approverScope(actor) },
      data: {
        status,
        decidedBy: actor.id,
        decidedAt: new Date(),
        version: { increment: 1 },
      },
    })
    return result.count === 1
  },

  autoApproveIfPending: async (db: Db, id: string) => {
    const result = await db.leaveRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        decidedAt: new Date(),
        version: { increment: 1 },
      },
    })
    return result.count === 1
  },

  cancelIfApproved: async (db: Db, where: { id: string; userId: string }, today: string) => {
    const result = await db.leaveRequest.updateMany({
      where: {
        ...where,
        status: 'APPROVED',
        startDate: { gte: isoToDate(today) },
      },
      data: { status: 'CANCELLED', version: { increment: 1 } },
    })
    return result.count === 1
  },
}
