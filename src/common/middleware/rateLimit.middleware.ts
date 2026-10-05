import { rateLimit } from 'express-rate-limit'
import { API_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from '@/common/constants'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'

export function createRateLimiter(limit: number, skipHealth = false) {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    limit,
    skip: skipHealth ? (req) => req.path.startsWith('/health') : undefined,
    handler: (_req, _res, next) => {
      next(new AppError(ERROR_CODES.RATE_LIMITED, 429, 'Too many requests, try again later'))
    },
  })
}

export const apiRateLimiter = createRateLimiter(API_RATE_LIMIT, true)
