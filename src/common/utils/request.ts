import type { Request } from 'express'
import { COOKIE_NAMES } from '@/common/constants'

export function readAccessToken(req: Request): string | undefined {
  const cookieToken: unknown = req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN]
  if (typeof cookieToken === 'string' && cookieToken) return cookieToken

  const [scheme, bearerToken] = (req.header('authorization') ?? '').split(' ')
  return scheme === 'Bearer' && bearerToken ? bearerToken : undefined
}
