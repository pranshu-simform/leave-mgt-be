import type { Request } from 'express'
import { COOKIE_NAMES } from '@/common/constants'

export function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN]
  return typeof value === 'string' && value ? value : undefined
}
