import type { CookieOptions, Response } from 'express'
import {
  ACCESS_TOKEN_TTL_SECONDS,
  COOKIE_NAMES,
  COOKIE_PATHS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@/common/constants'
import { env } from '@/config/env'
import type { IssuedSession } from '@/modules/auth/types/auth.types'

function baseOptions(path: string): CookieOptions {
  return { httpOnly: true, sameSite: 'none', secure: env.COOKIE_SECURE, path }
}

export function setSessionCookies(res: Response, session: IssuedSession): void {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, session.accessToken, {
    ...baseOptions(COOKIE_PATHS.ACCESS_TOKEN),
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  })
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, session.refreshToken, {
    ...baseOptions(COOKIE_PATHS.REFRESH_TOKEN),
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  })
}

export function clearSessionCookies(res: Response): void {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, baseOptions(COOKIE_PATHS.ACCESS_TOKEN))
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, baseOptions(COOKIE_PATHS.REFRESH_TOKEN))
}
