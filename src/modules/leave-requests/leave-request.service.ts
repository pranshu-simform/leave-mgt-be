import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { dateToIso, isoYear, todayIso } from '@/common/utils/dates'
import { buildPagination, toSkipTake } from '@/common/utils/pagination'
import { Role } from '@/generated/prisma/enums'
import { prisma, withTransaction, type Db } from '@/prisma/client'
import { findBalance } from '@/modules/balances'
import { getWorkingDays } from '@/modules/holidays'
import { evaluateLeaveRules, getActiveLeaveType } from '@/modules/leave-types'
import {
  leaveRequestRepository,
  type LeaveRequestRow,
} from '@/modules/leave-requests/leave-request.repository'
import type {
  CreateLeaveRequestInput,
  ListLeaveRequestsQuery,
  UpdateLeaveRequestInput,
} from '@/modules/leave-requests/leave-request.schema'
import type {
  LeaveRequestDto,
  RequestCheck,
  RequestViolation,
} from '@/modules/leave-requests/leave-request.types'

interface Actor {
  id: string
  role: Role
}

function toDto(row: LeaveRequestRow): LeaveRequestDto {
  return {
    id: row.id,
    leaveType: row.leaveType,
    startDate: dateToIso(row.startDate),
    endDate: dateToIso(row.endDate),
    days: row.days,
    note: row.note,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt.toISOString(),
  }
}

function notFound(): AppError {
  return new AppError(ERROR_CODES.NOT_FOUND, 404, 'Leave request not found')
}

async function checkRequest(
  userId: string,
  input: {
    leaveTypeId: string
    startDate: string
    endDate: string
    note?: string
  },
): Promise<RequestCheck> {
  const type = await getActiveLeaveType(input.leaveTypeId)
  if (!type) {
    throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Invalid request', [
      { field: 'leaveTypeId', message: 'Unknown leave type' },
    ])
  }

  const year = isoYear(input.startDate)
  if (year !== isoYear(input.endDate)) {
    return {
      days: 0,
      balance: null,
      violations: [
        {
          code: 'CROSS_YEAR_RANGE',
          field: 'endDate',
          message: 'A request cannot span two calendar years. Submit one request per year',
        },
      ],
    }
  }

  const days = await getWorkingDays(input.startDate, input.endDate)
  if (days === 0) {
    return {
      days,
      balance: null,
      violations: [
        {
          code: 'NO_WORKING_DAYS',
          field: 'endDate',
          message: 'The selected dates contain no working days',
        },
      ],
    }
  }

  const violations: RequestViolation[] = evaluateLeaveRules(type, {
    startDate: input.startDate,
    days,
    note: input.note,
    today: todayIso(),
  })

  let balance: RequestCheck['balance'] = null
  if (type.drawsFromBalance) {
    const row = await findBalance(userId, type.id, year)
    const allowance = row?.allowance ?? 0
    const used = row?.used ?? 0
    const remaining = allowance - used
    balance = { allowance, used, remaining, remainingAfter: remaining - days }
    if (days > remaining) {
      violations.push({
        code: 'INSUFFICIENT_BALANCE',
        field: 'endDate',
        message: `Only ${remaining} days remaining, ${days} requested`,
      })
    }
  }

  return { days, violations, balance }
}

function throwIfInvalid(check: RequestCheck): void {
  const [first] = check.violations
  if (first) {
    throw new AppError(
      first.code,
      422,
      first.message,
      check.violations.map(({ field, message }) => ({ field, message })),
    )
  }
}

export function previewLeaveRequest(actor: Actor, input: CreateLeaveRequestInput) {
  return checkRequest(actor.id, input)
}

export async function submitLeaveRequest(
  actor: Actor,
  input: CreateLeaveRequestInput,
): Promise<LeaveRequestDto> {
  const check = await checkRequest(actor.id, input)
  throwIfInvalid(check)

  const created = await withTransaction(async (tx) => {
    const request = await leaveRequestRepository.create(tx, {
      userId: actor.id,
      leaveTypeId: input.leaveTypeId,
      startDate: input.startDate,
      endDate: input.endDate,
      days: check.days,
      note: input.note || null,
    })
    await leaveRequestRepository.createEvent(tx, {
      requestId: request.id,
      actorId: actor.id,
      action: 'SUBMITTED',
      fromStatus: null,
      toStatus: 'PENDING',
    })
    return request
  })
  return toDto(created)
}

export async function listMyLeaveRequests(actor: Actor, query: ListLeaveRequestsQuery) {
  const { page, limit, ...filters } = query
  const { skip, take } = toSkipTake(page, limit)
  const { items, total } = await leaveRequestRepository.list(
    prisma,
    { userId: actor.id, ...filters },
    skip,
    take,
  )
  return {
    items: items.map(toDto),
    pagination: buildPagination(page, limit, total),
  }
}

export async function getLeaveRequest(actor: Actor, id: string): Promise<LeaveRequestDto> {
  const row = await leaveRequestRepository.findById(prisma, id)
  if (!row || (row.userId !== actor.id && actor.role !== Role.HR_ADMIN)) throw notFound()
  return toDto(row)
}

async function explainNoMatch(db: Db, id: string, userId: string): Promise<never> {
  const current = await leaveRequestRepository.findOwned(db, id, userId)
  if (!current) throw notFound()
  if (current.status !== 'PENDING') {
    throw new AppError(
      ERROR_CODES.REQUEST_LOCKED,
      409,
      `This request is ${current.status.toLowerCase()} and can no longer be changed`,
    )
  }
  throw new AppError(
    ERROR_CODES.VERSION_CONFLICT,
    409,
    'This request was changed elsewhere. Reload it and try again',
  )
}

export async function updateLeaveRequest(
  actor: Actor,
  id: string,
  input: UpdateLeaveRequestInput,
): Promise<LeaveRequestDto> {
  const existing = await leaveRequestRepository.findOwned(prisma, id, actor.id)
  if (!existing) throw notFound()
  if (existing.status !== 'PENDING') await explainNoMatch(prisma, id, actor.id)

  const check = await checkRequest(actor.id, {
    ...input,
    leaveTypeId: existing.leaveTypeId,
  })
  throwIfInvalid(check)

  const updated = await withTransaction(async (tx) => {
    const changed = await leaveRequestRepository.updateIfPending(
      tx,
      { id, userId: actor.id, version: input.version },
      {
        startDate: input.startDate,
        endDate: input.endDate,
        days: check.days,
        note: input.note || null,
      },
    )
    if (!changed) await explainNoMatch(tx, id, actor.id)

    await leaveRequestRepository.createEvent(tx, {
      requestId: id,
      actorId: actor.id,
      action: 'EDITED',
      fromStatus: 'PENDING',
      toStatus: 'PENDING',
      metadata: {
        from: {
          startDate: dateToIso(existing.startDate),
          endDate: dateToIso(existing.endDate),
          days: existing.days,
          note: existing.note,
        },
        to: {
          startDate: input.startDate,
          endDate: input.endDate,
          days: check.days,
          note: input.note || null,
        },
      },
    })
    return leaveRequestRepository.findById(tx, id)
  })
  return toDto(updated!)
}

export async function cancelLeaveRequest(actor: Actor, id: string): Promise<LeaveRequestDto> {
  const cancelled = await withTransaction(async (tx) => {
    const changed = await leaveRequestRepository.cancelIfPending(tx, {
      id,
      userId: actor.id,
    })
    if (!changed) await explainNoMatch(tx, id, actor.id)

    await leaveRequestRepository.createEvent(tx, {
      requestId: id,
      actorId: actor.id,
      action: 'CANCELLED',
      fromStatus: 'PENDING',
      toStatus: 'CANCELLED',
    })
    return leaveRequestRepository.findById(tx, id)
  })
  return toDto(cancelled!)
}
