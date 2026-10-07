import { monthBounds } from '@/common/utils/dates'
import { buildPagination, toSkipTake } from '@/common/utils/pagination'
import { prisma } from '@/prisma/client'
import { calendarRepository } from '@/modules/calendar/repositories/calendar.repository'
import type {
  CalendarActor,
  CalendarQuery,
  OverlapRequester,
  OverlapSummary,
  SummaryQuery,
  TeamDto,
} from '@/modules/calendar/types/calendar.types'
import { toItem } from '@/modules/calendar/utils/calendar.mappers'
import { resolveTeamScope } from '@/modules/calendar/utils/calendar.scope'

export async function getOverlaps(
  requester: OverlapRequester,
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

export async function getCalendar(actor: CalendarActor, query: CalendarQuery) {
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

export async function listTeams(): Promise<TeamDto[]> {
  return calendarRepository.findTeams(prisma)
}

export async function getCalendarSummary(actor: CalendarActor, query: SummaryQuery) {
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
