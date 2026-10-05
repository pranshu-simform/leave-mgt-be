import cors from 'cors'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { env } from '@/config/env'

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || origin === env.FRONTEND_ORIGIN) {
      callback(null, env.FRONTEND_ORIGIN)
      return
    }
    callback(new AppError(ERROR_CODES.FORBIDDEN, 403, 'Request origin is not allowed'))
  },
  credentials: true,
})
