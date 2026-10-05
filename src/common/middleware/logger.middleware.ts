import { pinoHttp } from 'pino-http'
import { logger } from '@/config/logger'

export const httpLogger = pinoHttp({
  logger,
  autoLogging: { ignore: (req) => req.url?.startsWith('/api/health') ?? false },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error'
    if (res.statusCode >= 400) return 'warn'
    return 'info'
  },
})
