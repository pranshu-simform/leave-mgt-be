import type { Db } from '@/prisma/client'
import { USER_LIST_RELATIONS } from '@/modules/users/constants/user.constants'
import type { CreateUserData, UserActor, UserListFilters } from '@/modules/users/types/user.types'
import { listWhere } from '@/modules/users/utils/user.queries'

export const userRepository = {
  findByEmail: (db: Db, email: string) => db.user.findUnique({ where: { email } }),

  findById: (db: Db, id: string) => db.user.findUnique({ where: { id } }),

  findInReadScope: (db: Db, id: string, actor: UserActor) =>
    db.user.findFirst({
      where: {
        id,
        ...(actor.role === 'HR_ADMIN' ? {} : { OR: [{ id: actor.id }, { managerId: actor.id }] }),
      },
    }),

  list: async (db: Db, filters: UserListFilters, skip: number, take: number) => {
    const where = listWhere(filters)
    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        include: USER_LIST_RELATIONS,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      db.user.count({ where }),
    ])
    return { items, total }
  },

  create: (db: Db, data: CreateUserData) => db.user.create({ data, include: USER_LIST_RELATIONS }),

  setInitialPasswordHash: async (db: Db, id: string, passwordHash: string) => {
    const result = await db.user.updateMany({
      where: { id, passwordHash: null, isActive: true },
      data: { passwordHash },
    })
    return result.count === 1
  },

  updatePasswordHash: (db: Db, id: string, passwordHash: string) =>
    db.user.update({ where: { id }, data: { passwordHash } }),
}
