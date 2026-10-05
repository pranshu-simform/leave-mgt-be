import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header('x-request-id')
  req.id = incoming && UUID.test(incoming) ? incoming : randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
}
