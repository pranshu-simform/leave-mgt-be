import { prisma } from '@/prisma/client'
import { leaveTypeRepository } from '@/modules/leave-types/leave-type.repository'
import type { LeaveTypeDto } from '@/modules/leave-types/leave-type.types'

export async function listLeaveTypes(): Promise<LeaveTypeDto[]> {
  const types = await leaveTypeRepository.findActive(prisma)
  return types.map((type) => ({
    id: type.id,
    code: type.code,
    name: type.name,
    drawsFromBalance: type.drawsFromBalance,
    defaultAllowanceDays: type.defaultAllowanceDays,
    allowRetroactive: type.allowRetroactive,
    minNoticeDays: type.minNoticeDays,
    maxConsecutiveDays: type.maxConsecutiveDays,
    requiresNote: type.requiresNote,
  }))
}
