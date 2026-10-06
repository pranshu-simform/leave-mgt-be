import { prisma } from '@/prisma/client'
import { holidayRepository } from '@/modules/holidays/holiday.repository'
import { countWorkingDays } from '@/modules/holidays/working-days'

export async function getWorkingDays(startDate: string, endDate: string): Promise<number> {
  const holidays = await holidayRepository.findDatesBetween(prisma, startDate, endDate)
  return countWorkingDays(startDate, endDate, new Set(holidays))
}
