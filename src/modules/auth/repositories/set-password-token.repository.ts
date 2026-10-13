import type { Db } from '@/prisma/client'
import type { CreateSetPasswordTokenData } from '@/modules/auth/types/auth.types'

export const setPasswordTokenRepository = {
  create: (db: Db, data: CreateSetPasswordTokenData) => db.setPasswordToken.create({ data }),

  findUsable: (db: Db, tokenHash: string, now: Date) =>
    db.setPasswordToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now },
        user: { isActive: true, passwordHash: null },
      },
      select: { user: { select: { name: true, email: true } } },
    }),

  consume: async (db: Db, tokenHash: string, now: Date): Promise<string | null> => {
    const rows = await db.$queryRaw<{ user_id: string }[]>`
      UPDATE set_password_tokens
      SET used_at = ${now}
      WHERE token_hash = ${tokenHash} AND used_at IS NULL AND expires_at > ${now}
      RETURNING user_id`
    return rows[0]?.user_id ?? null
  },

  invalidateForUser: (db: Db, userId: string, now: Date) =>
    db.setPasswordToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    }),
}
