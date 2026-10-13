import type { z } from 'zod'
import type {
  changePasswordSchema,
  loginSchema,
  setPasswordSchema,
  setPasswordTokenSchema,
} from '@/modules/auth/schemas/auth.schema'
import type { PublicUser } from '@/modules/users'

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
  expiresAt: Date
}

export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type SetPasswordInput = z.infer<typeof setPasswordSchema>
export type SetPasswordTokenInput = z.infer<typeof setPasswordTokenSchema>

export interface CreateSetPasswordTokenData {
  userId: string
  tokenHash: string
  expiresAt: Date
}

export interface InviteActor {
  id: string
  name: string
}

export interface SetPasswordLinkInfo {
  name: string
  email: string
}
