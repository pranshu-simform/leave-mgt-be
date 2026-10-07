import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { dateToIso, isoYear } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'
import { deductBalance } from '@/modules/balances'
import { leaveRequestRepository } from '@/modules/leave-requests/repositories/leave-request.repository'
import type { Approver, LeaveRequestRow } from '@/modules/leave-requests/types/leave-request.types'

export async function explainDecisionMiss(db: Db, id: string, actor: Approver): Promise<never> {
  if (await leaveRequestRepository.findOwned(db, id, actor.id)) {
    throw new AppError(
      ERROR_CODES.SELF_APPROVAL_FORBIDDEN,
      403,
      'You cannot decide your own leave request',
    )
  }
  const inScope = await leaveRequestRepository.findInApproverScope(db, id, actor)
  if (!inScope) throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Leave request not found')
  throw new AppError(
    ERROR_CODES.ALREADY_DECIDED,
    409,
    `This request is already ${inScope.status.toLowerCase()}`,
  )
}

export async function commitApproval(
  tx: Db,
  requestId: string,
  approver: Approver | null,
): Promise<LeaveRequestRow> {
  const changed = approver
    ? await leaveRequestRepository.decideIfPending(tx, requestId, approver, 'APPROVED')
    : await leaveRequestRepository.autoApproveIfPending(tx, requestId)
  if (!changed) {
    if (approver) await explainDecisionMiss(tx, requestId, approver)
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, 500, 'The request could not be auto-approved')
  }

  const request = await leaveRequestRepository.findById(tx, requestId)
  if (!request) throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Leave request not found')

  const actorId = approver?.id ?? request.userId
  if (request.leaveType.drawsFromBalance) {
    await deductBalance(tx, {
      userId: request.userId,
      leaveTypeId: request.leaveTypeId,
      year: isoYear(dateToIso(request.startDate)),
      days: request.days,
      requestId,
      actorId,
    })
  }

  await leaveRequestRepository.createEvent(tx, {
    requestId,
    actorId,
    action: approver ? 'APPROVED' : 'AUTO_APPROVED',
    fromStatus: 'PENDING',
    toStatus: 'APPROVED',
  })
  return request
}
