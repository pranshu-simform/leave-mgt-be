import type { Prisma } from '@/generated/prisma/client'
import type { EventAction, LeaveStatus } from '@/generated/prisma/enums'
import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'

const withLeaveType = {
  leaveType: { select: { id: true, code: true, name: true } },
} as const

export type LeaveRequestRow = Prisma.LeaveRequestGetPayload<{
  include: typeof withLeaveType
}>

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
      include: withLeaveType,
    }),

  createEvent: (
    db: Db,
    data: {
      requestId: string
      actorId: string
      action: EventAction
      fromStatus: LeaveStatus | null
      toStatus: LeaveStatus
      metadata?: Prisma.InputJsonValue
    },
  ) => db.leaveRequestEvent.create({ data }),

  findById: (db: Db, id: string) =>
    db.leaveRequest.findUnique({ where: { id }, include: withLeaveType }),

  findOwned: (db: Db, id: string, userId: string) =>
    db.leaveRequest.findFirst({
      where: { id, userId },
      include: withLeaveType,
    }),

  list: async (db: Db, filters: ListFilters, skip: number, take: number) => {
    const where = listWhere(filters)
    const [items, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: withLeaveType,
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
}
