import type { Request, Response } from 'express'
import { paginated } from '@/common/utils/response'
import { listAllRequests } from '@/modules/leave-requests'
import type { RequestListQuery } from '@/modules/admin/types/admin.types'

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as RequestListQuery
  const { page, limit, ...filters } = query
  const { items, pagination } = await listAllRequests(filters, page, limit)
  res.json(paginated(items, pagination))
}
