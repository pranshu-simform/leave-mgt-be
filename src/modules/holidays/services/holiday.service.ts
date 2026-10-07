import { monthBounds } from '@/common/utils/dates'
import { prisma } from '@/prisma/client'
import { holidayRepository } from '@/modules/holidays/repositories/holiday.repository'
import { countWorkingDays } from '@/modules/holidays/utils/holiday.working-days'

export async function getWorkingDays(startDate: string, endDate: string): Promise<number> {
  const holidays = await holidayRepository.findDatesBetween(prisma, startDate, endDate)
  return countWorkingDays(startDate, endDate, new Set(holidays))
}

// The public holidays of one month: a window of at most 31 days, so the list is bounded.
export function listHolidays(month: string) {
  const { from, to } = monthBounds(month)
  return holidayRepository.findBetween(prisma, from, to)
}
