import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { BCRYPT_COST, REFRESH_TOKEN_TTL_SECONDS } from '@/common/constants'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { signAccessToken } from '@/common/utils/jwt'
import { prisma, withTransaction, type Db } from '@/prisma/client'
import { DUMMY_PASSWORD_HASH } from '@/modules/auth/constants/auth.constants'
import { refreshTokenRepository } from '@/modules/auth/repositories/refresh-token.repository'
import type {
  AuthResult,
  ChangePasswordInput,
  LoginInput,
  RequestMeta,
} from '@/modules/auth/types/auth.types'
import { authRequired, invalidCredentials } from '@/modules/auth/utils/auth.errors'
import { generateRefreshToken, hashToken } from '@/modules/auth/utils/auth.tokens'
import { findUserByEmail, findUserById, setPasswordHash, toPublicUser } from '@/modules/users'

async function issueRefreshToken(
  db: Db,
  userId: string,
  familyId: string,
  meta: RequestMeta,
): Promise<string> {
  const raw = generateRefreshToken()
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

export async function login(input: LoginInput, meta: RequestMeta): Promise<AuthResult> {
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
): Promise<AuthResult> {
  if (!rawToken) throw authRequired()

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

  if (!result) throw authRequired()
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
