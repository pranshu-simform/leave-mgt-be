import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { monthBounds } from '@/common/utils/dates'
import { buildPagination, toSkipTake } from '@/common/utils/pagination'
import { Role } from '@/generated/prisma/enums'
import { prisma } from '@/prisma/client'
import { calendarRepository, type AbsenceRow } from '@/modules/calendar/calendar.repository'
import type { CalendarQuery, SummaryQuery } from '@/modules/calendar/calendar.schema'
import type { AbsenceItem, OverlapSummary } from '@/modules/calendar/calendar.types'

interface Actor {
  id: string
  role: Role
  managerId: string | null
}

function toItem(row: AbsenceRow): AbsenceItem {
  return {
    requestId: row.requestId,
    userId: row.userId,
    name: row.name,
    leaveType: { code: row.typeCode, name: row.typeName },
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
  }
}

function resolveTeamScope(actor: Actor, requested: string | undefined): string | null {
  if (actor.role === Role.HR_ADMIN) return requested ?? null
  const own = actor.role === Role.MANAGER ? actor.id : actor.managerId
  if (!own || (requested && requested !== own)) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Team not found')
  }
  return own
}

export async function getOverlaps(
  requester: { id: string; managerId: string | null },
  startDate: string,
  endDate: string,
): Promise<OverlapSummary> {
  const { managerId } = requester
  if (!managerId) return { overlapping: [], peakConcurrent: 0, teamSize: 0 }

  const key = { managerId, userId: requester.id, from: startDate, to: endDate }
  const [overlapping, peakConcurrent, teamSize] = await Promise.all([
    calendarRepository.findOverlapping(prisma, key),
    calendarRepository.peakConcurrent(prisma, key),
    calendarRepository.teamSize(prisma, managerId),
  ])
  return { overlapping: overlapping.map(toItem), peakConcurrent, teamSize }
}

export async function getCalendar(actor: Actor, query: CalendarQuery) {
  const teamLead = resolveTeamScope(actor, query.managerId)
  const { skip, take } = toSkipTake(query.page, query.limit)
  const { items, total } = await calendarRepository.findInMonth(
    prisma,
    { managerId: teamLead, status: query.status, ...monthBounds(query.month) },
    skip,
    take,
  )
  return {
    items: items.map(toItem),
    pagination: buildPagination(query.page, query.limit, total),
  }
}

export async function getCalendarSummary(actor: Actor, query: SummaryQuery) {
  const teamLead = resolveTeamScope(actor, query.managerId)
  const { skip, take } = toSkipTake(query.page, query.limit)
  const { items, total } = await calendarRepository.summarize(
    prisma,
    { managerId: teamLead, ...monthBounds(query.month) },
    skip,
    take,
  )
  return { items, pagination: buildPagination(query.page, query.limit, total) }
}
