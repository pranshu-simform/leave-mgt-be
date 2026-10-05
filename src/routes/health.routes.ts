import { Router } from 'express'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { ok } from '@/common/utils/response'
import { prisma } from '@/prisma/client'

export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  res.status(200).json(ok({ status: 'ok' }))
})

healthRouter.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (err) {
    req.log.error({ err }, 'Readiness check failed')
    throw new AppError(ERROR_CODES.SERVICE_UNAVAILABLE, 503, 'Database is not reachable')
  }
  res.status(200).json(ok({ status: 'ready' }))
})
