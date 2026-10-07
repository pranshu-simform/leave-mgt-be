import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { isoYear, todayIso } from '@/common/utils/dates'
import { prisma, withTransaction } from '@/prisma/client'
import { allocateYear } from '@/modules/balances'
import { leaveTypeRepository } from '@/modules/leave-types/repositories/leave-type.repository'
import type {
  AdminLeaveTypeDto,
  CreateLeaveTypeData,
  LeaveTypeDto,
  UpdateLeaveTypeData,
} from '@/modules/leave-types/types/leave-type.types'
import { toLeaveTypeError } from '@/modules/leave-types/utils/leave-type.errors'
import { toAdminLeaveTypeDto, toLeaveTypeDto } from '@/modules/leave-types/utils/leave-type.mappers'

export function getActiveLeaveType(id: string) {
  return leaveTypeRepository.findActiveById(prisma, id)
}

export async function listLeaveTypes(): Promise<LeaveTypeDto[]> {
  const types = await leaveTypeRepository.findActive(prisma)
  return types.map(toLeaveTypeDto)
}

export async function listAdminLeaveTypes(): Promise<AdminLeaveTypeDto[]> {
  const types = await leaveTypeRepository.findAll(prisma)
  return types.map(toAdminLeaveTypeDto)
}

function noAllowanceWithoutBalance(): AppError {
  return new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Invalid request', [
    {
      field: 'defaultAllowanceDays',
      message: 'A leave type that does not draw from a balance has no allowance',
    },
  ])
}

export async function createLeaveType(data: CreateLeaveTypeData): Promise<AdminLeaveTypeDto> {
  if (!data.drawsFromBalance && data.defaultAllowanceDays !== 0) throw noAllowanceWithoutBalance()

  const created = await withTransaction(async (tx) => {
    const type = await leaveTypeRepository.create(tx, data)
    if (type.drawsFromBalance) await allocateYear(isoYear(todayIso()), tx)
    return type
  }).catch((err: unknown) => {
    throw toLeaveTypeError(err)
  })
  return toAdminLeaveTypeDto(created)
}

export async function updateLeaveType(
  id: string,
  data: UpdateLeaveTypeData,
): Promise<AdminLeaveTypeDto> {
  const existing = await leaveTypeRepository.findById(prisma, id)
  if (!existing) throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Leave type not found')
  if (!existing.drawsFromBalance && data.defaultAllowanceDays) throw noAllowanceWithoutBalance()

  return toAdminLeaveTypeDto(await leaveTypeRepository.update(prisma, id, data))
}
