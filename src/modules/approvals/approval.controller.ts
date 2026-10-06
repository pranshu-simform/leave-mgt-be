import type { Request, Response } from 'express'
import { ok, paginated } from '@/common/utils/response'
import type { IdParam } from '@/common/validators/common.schema'
import type { ApprovalQuery, RejectInput } from '@/modules/approvals/approval.schema'
import {
  approveLeaveRequest,
  getRequestOverlaps,
  listRequestsForApprover,
  rejectLeaveRequest,
} from '@/modules/leave-requests'

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as ApprovalQuery
  const { items, pagination } = await listRequestsForApprover(req.user!, query)
  res.json(paginated(items, pagination))
}

export async function approve(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  res.json(ok(await approveLeaveRequest(req.user!, params.id), 'Leave request approved'))
}

export async function reject(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  const body = req.validated?.body as RejectInput
  res.json(
    ok(await rejectLeaveRequest(req.user!, params.id, body.reason), 'Leave request rejected'),
  )
}

export async function overlaps(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  res.json(ok(await getRequestOverlaps(req.user!, params.id)))
}
