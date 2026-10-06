import type { Db } from '@/prisma/client'

const MAX_LEAVE_TYPES = 100

export const leaveTypeRepository = {
  findActive: (db: Db) =>
    db.leaveType.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
      take: MAX_LEAVE_TYPES,
    }),
}
