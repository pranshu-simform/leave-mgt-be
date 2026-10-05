import type { NextFunction, Request, Response } from 'express'
import { COOKIE_NAMES } from '@/common/constants'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import type { Role } from '@/generated/prisma/enums'
import { verifyAccessToken } from '@/common/utils/jwt'
import { findUserById } from '@/modules/users'

function readAccessToken(req: Request): string | undefined {
  const cookieToken: unknown = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN]
  if (typeof cookieToken === 'string' && cookieToken) return cookieToken

  const [scheme, bearerToken] = (req.header('authorization') ?? '').split(' ')
  return scheme === 'Bearer' && bearerToken ? bearerToken : undefined
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = readAccessToken(req)
  if (!token) {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Authentication required')
  }

  const { userId } = verifyAccessToken(token)
  const user = await findUserById(userId)
  if (!user?.isActive) {
    throw new AppError(ERROR_CODES.UNAUTHENTICATED, 401, 'Authentication required')
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
  next()
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(ERROR_CODES.FORBIDDEN, 403, 'You do not have access to this resource')
    }
    next()
  }
}
