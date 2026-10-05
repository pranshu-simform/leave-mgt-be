import type { Db } from '@/prisma/client'

export const refreshTokenRepository = {
  create: (
    db: Db,
    data: {
      userId: string
      tokenHash: string
      familyId: string
      expiresAt: Date
      userAgent?: string
      ip?: string
    },
  ) => db.refreshToken.create({ data }),

  findByHash: (db: Db, tokenHash: string) => db.refreshToken.findUnique({ where: { tokenHash } }),

  consume: async (db: Db, tokenHash: string, now: Date) => {
    const result = await db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    })
    return result.count === 1
  },

  revokeByHash: (db: Db, tokenHash: string, now: Date) =>
    db.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    }),

  revokeFamily: (db: Db, familyId: string, now: Date) =>
    db.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now },
    }),

  revokeAllForUser: (db: Db, userId: string, now: Date) =>
    db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    }),
}
