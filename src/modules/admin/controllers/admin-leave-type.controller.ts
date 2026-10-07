import type { Request, Response } from 'express'
import { ok } from '@/common/utils/response'
import type { IdParam } from '@/common/types/common.types'
import { createLeaveType, listAdminLeaveTypes, updateLeaveType } from '@/modules/leave-types'
import type { CreateLeaveTypeInput, UpdateLeaveTypeInput } from '@/modules/admin/types/admin.types'

export async function list(_req: Request, res: Response): Promise<void> {
  res.json(ok(await listAdminLeaveTypes()))
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.validated?.body as CreateLeaveTypeInput
  res.status(201).json(ok(await createLeaveType(body), 'Leave type created'))
}

export async function update(req: Request, res: Response): Promise<void> {
  const params = req.validated?.params as IdParam
  const body = req.validated?.body as UpdateLeaveTypeInput
  res.json(ok(await updateLeaveType(params.id, body), 'Leave type updated'))
}
