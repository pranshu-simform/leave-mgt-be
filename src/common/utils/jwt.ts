import jwt from 'jsonwebtoken'
import { ACCESS_TOKEN_TTL_SECONDS } from '@/common/constants'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import type { Role } from '@/generated/prisma/enums'
import { env } from '@/config/env'

export function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: userId,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  })
}

export function verifyAccessToken(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof payload === 'object' && typeof payload.sub === 'string') {
      return { userId: payload.sub }
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(ERROR_CODES.TOKEN_EXPIRED, 401, 'Access token expired')
    }
  }
  throw new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Authentication required')
}
