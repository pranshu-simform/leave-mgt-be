import type { NextFunction, Request, Response } from 'express'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { toAppError } from '@/common/errors/errorHandler'
import { fail } from '@/common/utils/response'
import { env } from '@/config/env'

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err)
    return
  }

  const appError = toAppError(err)

  if (appError.status >= 500) {
    req.log.error({ err, requestId: req.id }, appError.message)
  } else {
    req.log.warn({ code: appError.code, requestId: req.id }, appError.message)
  }

  const hideMessage = appError.code === ERROR_CODES.INTERNAL_ERROR && env.NODE_ENV === 'production'
  const message = hideMessage ? 'Internal server error' : appError.message

  res.status(appError.status).json(fail(appError.code, message, appError.details))
}
