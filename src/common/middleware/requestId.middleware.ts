import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { REQUEST_ID_PATTERN } from '@/common/constants'

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id')
  req.id = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
}
