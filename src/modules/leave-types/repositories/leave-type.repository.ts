import type { Db } from '@/prisma/client'
import { MAX_LEAVE_TYPES } from '@/modules/leave-types/constants/leave-type.constants'
import type {
  CreateLeaveTypeData,
  UpdateLeaveTypeData,
} from '@/modules/leave-types/types/leave-type.types'

export const leaveTypeRepository = {
  findActiveById: (db: Db, id: string) => db.leaveType.findFirst({ where: { id, isActive: true } }),

  findActive: (db: Db) =>
    db.leaveType.findMany({
      where: { isActive: true },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      take: MAX_LEAVE_TYPES,
    }),

  findAll: (db: Db) =>
    db.leaveType.findMany({ orderBy: [{ name: 'asc' }, { id: 'asc' }], take: MAX_LEAVE_TYPES }),

  findById: (db: Db, id: string) => db.leaveType.findUnique({ where: { id } }),

  create: (db: Db, data: CreateLeaveTypeData) => db.leaveType.create({ data }),

  update: (db: Db, id: string, data: UpdateLeaveTypeData) =>
    db.leaveType.update({ where: { id }, data }),
}
