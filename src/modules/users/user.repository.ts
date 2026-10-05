import type { Db } from '@/prisma/client'

export const userRepository = {
  findByEmail: (db: Db, email: string) => db.user.findUnique({ where: { email } }),

  findById: (db: Db, id: string) => db.user.findUnique({ where: { id } }),

  updatePasswordHash: (db: Db, id: string, passwordHash: string) =>
    db.user.update({ where: { id }, data: { passwordHash } }),
}
