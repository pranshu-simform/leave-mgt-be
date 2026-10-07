import type { NextFunction, Request, Response } from 'express'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import type { Role } from '@/generated/prisma/enums'
import { verifyAccessToken } from '@/common/utils/jwt'
import { readAccessToken } from '@/common/utils/request'
import { findUserById } from '@/modules/users'

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
    managerId: user.managerId,
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
