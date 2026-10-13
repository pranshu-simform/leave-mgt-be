import type { Request, Response } from 'express'
import { ok, paginated } from '@/common/utils/response'
import type { IdParam } from '@/common/types/common.types'
import { inviteUser, resendInvite } from '@/modules/auth'
import { listUsers } from '@/modules/users'
import type { CreateUserInput, UserListQuery } from '@/modules/admin/types/admin.types'

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as UserListQuery
  const { page, limit, ...filters } = query
  const { items, pagination } = await listUsers(filters, page, limit)
  res.json(paginated(items, pagination))
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateUserInput
  const user = await inviteUser(req.user!, body)
  res.status(201).json(ok(user, 'User created. A link to set a password was emailed'))
}

export async function resend(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  await resendInvite(req.user!, params.id)
  res.json(ok(null, 'A new link was emailed'))
}
