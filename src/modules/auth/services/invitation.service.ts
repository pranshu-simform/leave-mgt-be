import bcrypt from 'bcryptjs'
import { BCRYPT_COST, SET_PASSWORD_TOKEN_TTL_SECONDS } from '@/common/constants'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { isoYear, todayIso } from '@/common/utils/dates'
import { prisma, withTransaction, type Db } from '@/prisma/client'
import { allocateUserYear } from '@/modules/balances'
import { sendSetPasswordEmail } from '@/modules/email'
import { setPasswordTokenRepository } from '@/modules/auth/repositories/set-password-token.repository'
import type {
  InviteActor,
  SetPasswordLinkInfo,
  SetPasswordTokenInput,
} from '@/modules/auth/types/auth.types'
import { invalidLink } from '@/modules/auth/utils/auth.errors'
import { generateSetPasswordToken, hashToken } from '@/modules/auth/utils/auth.tokens'
import {
  createUser,
  findUserById,
  setInitialPasswordHash,
  toUserListItemDto,
  type CreateUserData,
  type UserListItemDto,
} from '@/modules/users'

async function issueSetPasswordToken(db: Db, userId: string): Promise<string> {
  const raw = generateSetPasswordToken()
  await setPasswordTokenRepository.create(db, {
    userId,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + SET_PASSWORD_TOKEN_TTL_SECONDS * 1000),
  })
  return raw
}

export async function inviteUser(
  actor: InviteActor,
  data: CreateUserData,
): Promise<UserListItemDto> {
  const { user, token } = await withTransaction(async (tx) => {
    const created = await createUser(tx, data)
    await allocateUserYear(created.id, isoYear(todayIso()), tx, actor.id)
    return {
      user: created,
      token: await issueSetPasswordToken(tx, created.id),
    }
  })
  sendSetPasswordEmail(
    { id: user.id, name: user.name, email: user.email },
    user.role,
    actor.name,
    token,
  )
  return toUserListItemDto(user)
}

export async function resendInvite(actor: InviteActor, userId: string): Promise<void> {
  const user = await findUserById(userId)
  if (!user) throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'User not found')
  if (user.passwordHash) {
    throw new AppError(ERROR_CODES.ALREADY_EXISTS, 409, 'This person has already set a password')
  }
  if (!user.isActive) {
    throw new AppError(
      ERROR_CODES.VALIDATION_ERROR,
      400,
      'This person is inactive, so a link cannot be sent',
    )
  }
  const token = await withTransaction(async (tx) => {
    await setPasswordTokenRepository.invalidateForUser(tx, user.id, new Date())
    return issueSetPasswordToken(tx, user.id)
  })
  sendSetPasswordEmail(
    { id: user.id, name: user.name, email: user.email },
    user.role,
    actor.name,
    token,
  )
}

export async function checkSetPasswordLink(
  input: SetPasswordTokenInput,
): Promise<SetPasswordLinkInfo> {
  const link = await setPasswordTokenRepository.findUsable(
    prisma,
    hashToken(input.token),
    new Date(),
  )
  if (!link) throw invalidLink()
  return { name: link.user.name, email: link.user.email }
}

export async function setPassword(
  input: SetPasswordTokenInput & { password: string },
): Promise<void> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST)
  await withTransaction(async (tx) => {
    const now = new Date()
    const userId = await setPasswordTokenRepository.consume(tx, hashToken(input.token), now)
    if (!userId || !(await setInitialPasswordHash(tx, userId, passwordHash))) throw invalidLink()
    await setPasswordTokenRepository.invalidateForUser(tx, userId, now)
  })
}
