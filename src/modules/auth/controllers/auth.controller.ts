import type { Request, Response } from 'express'
import { ok } from '@/common/utils/response'
import * as authService from '@/modules/auth/services/auth.service'
import * as invitationService from '@/modules/auth/services/invitation.service'
import type {
  ChangePasswordInput,
  LoginInput,
  SetPasswordInput,
  SetPasswordTokenInput,
} from '@/modules/auth/types/auth.types'
import { clearSessionCookies, setSessionCookies } from '@/modules/auth/utils/auth.cookies'
import { readRefreshCookie, requestMeta } from '@/modules/auth/utils/auth.request'
import { toPublicUser } from '@/modules/users'

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

export async function checkSetPasswordLink(req: Request, res: Response): Promise<void> {
  const info = await invitationService.checkSetPasswordLink(
    req.validated?.body as SetPasswordTokenInput,
  )
  res.json(ok(info))
}

export async function setPassword(req: Request, res: Response): Promise<void> {
  await invitationService.setPassword(req.validated?.body as SetPasswordInput)
  res.json(ok(null, 'Password set. You can sign in now'))
}
