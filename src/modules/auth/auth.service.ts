import { createHash, randomBytes, randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { BCRYPT_COST, REFRESH_TOKEN_TTL_SECONDS } from '@/common/constants'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { signAccessToken } from '@/common/utils/jwt'
import { prisma, withTransaction, type Db } from '@/prisma/client'
import { refreshTokenRepository } from '@/modules/auth/refresh-token.repository'
import type { ChangePasswordInput, LoginInput } from '@/modules/auth/auth.schema'
import type { IssuedSession, RequestMeta } from '@/modules/auth/auth.types'
import {
  findUserByEmail,
  findUserById,
  setPasswordHash,
  toPublicUser,
  type PublicUser,
} from '@/modules/users'

// Compared against when the email is unknown, so a miss costs the same as a wrong password.
const DUMMY_PASSWORD_HASH = '$2b$10$IC/YqALIkNJBhyLaP7.j7.BZ2qoz1c6y1lmHiznf75DVxL38UM6Bq'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function invalidCredentials(): AppError {
  return new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Invalid email or password')
}

async function issueRefreshToken(
  db: Db,
  userId: string,
  familyId: string,
  meta: RequestMeta,
): Promise<string> {
  const raw = randomBytes(32).toString('base64url')
  await refreshTokenRepository.create(db, {
    userId,
    tokenHash: hashToken(raw),
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    userAgent: meta.userAgent,
    ip: meta.ip,
  })
  return raw
}

export async function login(
  input: LoginInput,
  meta: RequestMeta,
): Promise<{ user: PublicUser; session: IssuedSession }> {
  const user = await findUserByEmail(input.email)
  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  )
  if (!user || !passwordMatches || !user.isActive) throw invalidCredentials()

  const refreshToken = await issueRefreshToken(prisma, user.id, randomUUID(), meta)
  return {
    user: toPublicUser(user),
    session: { accessToken: signAccessToken(user.id, user.role), refreshToken },
  }
}

export async function refresh(
  rawToken: string | undefined,
  meta: RequestMeta,
): Promise<{ user: PublicUser; session: IssuedSession }> {
  if (!rawToken) throw new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Authentication required')

  const tokenHash = hashToken(rawToken)
  const now = new Date()

  const result = await withTransaction(async (tx) => {
    const consumed = await refreshTokenRepository.consume(tx, tokenHash, now)
    const existing = await refreshTokenRepository.findByHash(tx, tokenHash)
    if (!existing) return null

    if (!consumed) {
      if (existing.revokedAt) await refreshTokenRepository.revokeFamily(tx, existing.familyId, now)
      return null
    }

    const user = await findUserById(existing.userId)
    if (!user?.isActive) {
      await refreshTokenRepository.revokeFamily(tx, existing.familyId, now)
      return null
    }

    const nextToken = await issueRefreshToken(tx, user.id, existing.familyId, meta)
    return {
      user: toPublicUser(user),
      session: {
        accessToken: signAccessToken(user.id, user.role),
        refreshToken: nextToken,
      },
    }
  })

  if (!result) throw new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Authentication required')
  return result
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return
  await refreshTokenRepository.revokeByHash(prisma, hashToken(rawToken), new Date())
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await findUserById(userId)
  const currentMatches =
    user !== null && (await bcrypt.compare(input.currentPassword, user.passwordHash))
  if (!currentMatches) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Invalid request', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ])
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST)
  await withTransaction(async (tx) => {
    await setPasswordHash(tx, userId, passwordHash)
    await refreshTokenRepository.revokeAllForUser(tx, userId, new Date())
  })
}
