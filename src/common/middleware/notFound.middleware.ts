import type { NextFunction, Request, Response } from 'express'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(
    new AppError(ERROR_CODES.NOT_FOUND, 404, `Route not found: ${req.method} ${req.originalUrl}`),
  )
}
