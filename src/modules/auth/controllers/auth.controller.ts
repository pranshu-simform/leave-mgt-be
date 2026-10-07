import type { Request, Response } from 'express'
import { COOKIE_NAMES } from '@/common/constants'
import { ok } from '@/common/utils/response'
import { clearSessionCookies, setSessionCookies } from '@/modules/auth/utils/auth.cookies'
import type { ChangePasswordInput, LoginInput } from '@/modules/auth/schemas/auth.schema'
import * as authService from '@/modules/auth/services/auth.service'
import type { RequestMeta } from '@/modules/auth/types/auth.types'
import { toPublicUser } from '@/modules/users'

function requestMeta(req: Request): RequestMeta {
  return { userAgent: req.header('user-agent'), ip: req.ip }
}

function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN]
  return typeof value === 'string' && value ? value : undefined
}

export async function login(req: Request, res: Response): Promise<void> {
  const { user, session } = await authService.login(
    req.validated?.body as LoginInput,
    requestMeta(req),
  )
  setSessionCookies(res, session)
  res.json(ok(user))
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { user, session } = await authService.refresh(readRefreshCookie(req), requestMeta(req))
  setSessionCookies(res, session)
  res.json(ok(user))
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(readRefreshCookie(req))
  clearSessionCookies(res)
  res.json(ok(null, 'Signed out'))
}

export function me(req: Request, res: Response): void {
  res.json(ok(req.user ? toPublicUser(req.user) : null))
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await authService.changePassword(req.user!.id, req.validated?.body as ChangePasswordInput)
  clearSessionCookies(res)
  res.json(ok(null, 'Password changed. Please sign in again'))
}
