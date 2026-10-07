import type { Request } from 'express'
import { COOKIE_NAMES } from '@/common/constants'
import type { RequestMeta } from '@/modules/auth/types/auth.types'

export function requestMeta(req: Request): RequestMeta {
  return { userAgent: req.header('user-agent'), ip: req.ip }
}

export function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN]
  return typeof value === 'string' && value ? value : undefined
}
