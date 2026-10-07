import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { Role } from '@/generated/prisma/enums'
import type { CalendarActor } from '@/modules/calendar/types/calendar.types'

export function resolveTeamScope(
  actor: CalendarActor,
  requested: string | undefined,
): string | null {
  if (actor.role === Role.HR_ADMIN) return requested ?? null
  const own = actor.role === Role.MANAGER ? actor.id : actor.managerId
  if (!own || (requested && requested !== own)) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Team not found')
  }
  return own
}
