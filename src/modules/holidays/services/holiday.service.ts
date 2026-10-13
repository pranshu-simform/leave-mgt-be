import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { monthBounds } from '@/common/utils/dates'
import { buildPagination, toSkipTake } from '@/common/utils/pagination'
import { prisma } from '@/prisma/client'
import { holidayRepository } from '@/modules/holidays/repositories/holiday.repository'
import type { AdminHolidayDto, CreateHolidayData } from '@/modules/holidays/types/holiday.types'
import { countWorkingDays } from '@/modules/holidays/utils/holiday.working-days'
import { toHolidayError } from '@/modules/holidays/utils/holiday.errors'
import { toAdminHolidayDto } from '@/modules/holidays/utils/holiday.mappers'

export async function getWorkingDays(startDate: string, endDate: string): Promise<number> {
  const holidays = await holidayRepository.findDatesBetween(prisma, startDate, endDate)
  return countWorkingDays(startDate, endDate, new Set(holidays))
}

// The public holidays of one month: a window of at most 31 days, so the list is bounded.
export function listHolidays(month: string) {
  const { from, to } = monthBounds(month)
  return holidayRepository.findBetween(prisma, from, to)
}

export async function listHolidaysForYear(year: number, page: number, limit: number) {
  const { skip, take } = toSkipTake(page, limit)
  const { items, total } = await holidayRepository.findByYear(prisma, year, skip, take)
  return {
    items: items.map(toAdminHolidayDto),
    pagination: buildPagination(page, limit, total),
  }
}

export async function createHoliday(data: CreateHolidayData): Promise<AdminHolidayDto> {
  const created = await holidayRepository.create(prisma, data).catch((err: unknown) => {
    throw toHolidayError(err)
  })
  return toAdminHolidayDto(created)
}

export async function deleteHoliday(id: string): Promise<{ id: string }> {
  if (!(await holidayRepository.deleteById(prisma, id))) {
    throw new AppError(ERROR_CODES.NOT_FOUND, 404, 'Holiday not found')
  }
  return { id }
}
