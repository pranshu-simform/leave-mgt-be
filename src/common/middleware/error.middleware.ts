import type { NextFunction, Request, Response } from 'express'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { toAppError } from '@/common/errors/errorHandler'
import { env } from '@/config/env'

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err)
    return
  }

  const appError = toAppError(err)
  const isServerError = appError.status >= 500

  if (isServerError) {
    req.log.error({ err, requestId: req.id }, appError.message)
  } else {
    req.log.warn({ code: appError.code, requestId: req.id }, appError.message)
  }

  const hideMessage = appError.code === ERROR_CODES.INTERNAL_ERROR && env.NODE_ENV === 'production'

  res.status(appError.status).json({
    error: {
      code: appError.code,
      message: hideMessage ? 'Internal server error' : appError.message,
      ...(isServerError ? { requestId: req.id } : {}),
    },
  })
}
