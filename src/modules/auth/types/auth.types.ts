import type { z } from 'zod'
import type { changePasswordSchema, loginSchema } from '@/modules/auth/schemas/auth.schema'
import type { PublicUser } from '@/modules/users'

export interface RequestMeta {
  userAgent?: string
  ip?: string
}

export interface IssuedSession {
  accessToken: string
  refreshToken: string
}

export interface AuthResult {
  user: PublicUser
  session: IssuedSession
}

export interface CreateRefreshTokenData {
  userId: string
  tokenHash: string
  familyId: string
  expiresAt: Date
  userAgent?: string
  ip?: string
}

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
