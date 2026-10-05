import type { Role } from '@/generated/prisma/enums'
import type { Db } from '@/prisma/client'

export const userRepository = {
  findByEmail: (db: Db, email: string) => db.user.findUnique({ where: { email } }),

  findById: (db: Db, id: string) => db.user.findUnique({ where: { id } }),

  findInReadScope: (db: Db, id: string, actor: { id: string; role: Role }) =>
    db.user.findFirst({
      where: {
        id,
        ...(actor.role === 'HR_ADMIN' ? {} : { OR: [{ id: actor.id }, { managerId: actor.id }] }),
      },
    }),

  updatePasswordHash: (db: Db, id: string, passwordHash: string) =>
    db.user.update({ where: { id }, data: { passwordHash } }),
}
