import type { Prisma } from '@/generated/prisma/client'
import { isoToDate } from '@/common/utils/dates'
import type { LeaveStatus } from '@/generated/prisma/enums'
import type { Db } from '@/prisma/client'
import { LEAVE_REQUEST_RELATIONS } from '@/modules/leave-requests/constants/leave-request.constants'
import type {
  Approver,
  CreateEventData,
  CreateLeaveRequestData,
  DecisionStatus,
  ListFilters,
  OwnedRequestKey,
  ScopeActor,
  UpdateLeaveRequestData,
  UpdateWhere,
} from '@/modules/leave-requests/types/leave-request.types'
import {
  approverScope,
  listWhere,
  readScope,
} from '@/modules/leave-requests/utils/leave-request.queries'

export const leaveRequestRepository = {
  create: (db: Db, data: CreateLeaveRequestData) =>
    db.leaveRequest.create({
      data: {
        ...data,
        startDate: isoToDate(data.startDate),
        endDate: isoToDate(data.endDate),
      },
      include: LEAVE_REQUEST_RELATIONS,
    }),

  createEvent: (db: Db, data: CreateEventData) => db.leaveRequestEvent.create({ data }),

  findById: (db: Db, id: string) =>
    db.leaveRequest.findUnique({ where: { id }, include: LEAVE_REQUEST_RELATIONS }),

  findReadable: (db: Db, id: string, actor: ScopeActor) =>
    db.leaveRequest.findFirst({
      where: { id, ...readScope(actor) },
      include: LEAVE_REQUEST_RELATIONS,
    }),

  listEvents: async (db: Db, requestId: string, skip: number, take: number) => {
    const where = { requestId }
    const [items, total] = await Promise.all([
      db.leaveRequestEvent.findMany({
        where,
        include: { actor: { select: { id: true, name: true } } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      db.leaveRequestEvent.count({ where }),
    ])
    return { items, total }
  },

  findOwned: (db: Db, id: string, userId: string) =>
    db.leaveRequest.findFirst({
      where: { id, userId },
      include: LEAVE_REQUEST_RELATIONS,
    }),

  list: async (db: Db, filters: ListFilters, skip: number, take: number) => {
    const where = listWhere(filters)
    const [items, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        include: LEAVE_REQUEST_RELATIONS,
        // Newest first, except the upcoming view (`from`), which reads soonest first.
        orderBy: [{ startDate: filters.from ? 'asc' : 'desc' }, { id: 'asc' }],
        skip,
        take,
      }),
      db.leaveRequest.count({ where }),
    ])
    return { items, total }
  },

  updateIfPending: async (db: Db, where: UpdateWhere, data: UpdateLeaveRequestData) => {
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

  cancelIfPending: async (db: Db, where: OwnedRequestKey) => {
    const result = await db.leaveRequest.updateMany({
      where: { ...where, status: 'PENDING' },
      data: { status: 'CANCELLED', version: { increment: 1 } },
    })
    return result.count === 1
  },

  findInApproverScope: (db: Db, id: string, actor: Approver) =>
    db.leaveRequest.findFirst({
      where: { id, user: approverScope(actor) },
      include: LEAVE_REQUEST_RELATIONS,
    }),

  listForApprover: async (
    db: Db,
    actor: Approver,
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
        include: LEAVE_REQUEST_RELATIONS,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      db.leaveRequest.count({ where }),
    ])
    return { items, total }
  },

  decideIfPending: async (db: Db, id: string, actor: Approver, status: DecisionStatus) => {
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

  cancelIfApproved: async (db: Db, where: OwnedRequestKey, today: string) => {
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
