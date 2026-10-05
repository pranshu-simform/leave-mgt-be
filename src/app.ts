import express from 'express'
import helmet from 'helmet'
import { corsMiddleware } from '@/common/middleware/cors.middleware'
import { errorHandler } from '@/common/middleware/error.middleware'
import { httpLogger } from '@/common/middleware/logger.middleware'
import { notFound } from '@/common/middleware/notFound.middleware'
import { apiRateLimiter } from '@/common/middleware/rateLimit.middleware'
import { requestId } from '@/common/middleware/requestId.middleware'
import { apiRouter } from '@/routes'

export const app = express()

app.use(requestId)
app.use(httpLogger)
app.use(helmet())
app.use(corsMiddleware)
app.use('/api', apiRateLimiter)
app.use(express.json())

app.use('/api', apiRouter)

app.use(notFound)
app.use(errorHandler)
