import { prisma } from '@/prisma/client'
import { leaveTypeRepository } from '@/modules/leave-types/repositories/leave-type.repository'
import type { LeaveTypeDto } from '@/modules/leave-types/types/leave-type.types'

export function getActiveLeaveType(id: string) {
  return leaveTypeRepository.findActiveById(prisma, id)
}

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
