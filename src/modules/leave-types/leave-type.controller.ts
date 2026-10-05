import type { Request, Response } from 'express'
import { ok } from '@/common/utils/response'
import { listLeaveTypes } from '@/modules/leave-types/leave-type.service'

export async function list(_req: Request, res: Response): Promise<void> {
  res.json(ok(await listLeaveTypes()))
}
