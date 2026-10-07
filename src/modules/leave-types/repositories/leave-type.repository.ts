import type { Db } from '@/prisma/client'
import { MAX_LEAVE_TYPES } from '@/modules/leave-types/constants/leave-type.constants'

export const leaveTypeRepository = {
  findActiveById: (db: Db, id: string) => db.leaveType.findFirst({ where: { id, isActive: true } }),

  findActive: (db: Db) =>
    db.leaveType.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      take: MAX_LEAVE_TYPES,
    }),
}
