import type { Request, Response } from 'express'
import type { IdParam } from '@/common/validators/common.schema'
import { ok, paginated } from '@/common/utils/response'
import type {
  CreateLeaveRequestInput,
  ListLeaveRequestsQuery,
  UpdateLeaveRequestInput,
} from '@/modules/leave-requests/leave-request.schema'
import * as leaveRequestService from '@/modules/leave-requests/leave-request.service'

export async function preview(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateLeaveRequestInput
  res.json(ok(await leaveRequestService.previewLeaveRequest(req.user!, body)))
}

export async function submit(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateLeaveRequestInput
  const created = await leaveRequestService.submitLeaveRequest(req.user!, body)
  res.status(201).json(ok(created, 'Leave request submitted'))
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const query = req.validated?.query as ListLeaveRequestsQuery
  const { items, pagination } = await leaveRequestService.listMyLeaveRequests(req.user!, query)
  res.json(paginated(items, pagination))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  res.json(ok(await leaveRequestService.getLeaveRequest(req.user!, params.id)))
}

export async function update(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  const body = req.validated?.body as UpdateLeaveRequestInput
  const updated = await leaveRequestService.updateLeaveRequest(req.user!, params.id, body)
  res.json(ok(updated, 'Leave request updated'))
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  res.json(
    ok(
      await leaveRequestService.cancelLeaveRequest(req.user!, params.id),
      'Leave request cancelled',
    ),
  )
}
