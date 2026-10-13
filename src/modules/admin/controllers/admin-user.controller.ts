import type { Request, Response } from 'express'
import { paginated } from '@/common/utils/response'
import { listUsers } from '@/modules/users'
import type { UserListQuery } from '@/modules/admin/types/admin.types'

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as UserListQuery
  const { page, limit, ...filters } = query
  const { items, pagination } = await listUsers(filters, page, limit)
  res.json(paginated(items, pagination))
}
