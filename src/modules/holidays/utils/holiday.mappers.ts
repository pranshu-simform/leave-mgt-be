import { dateToIso } from '@/common/utils/dates'
import type { PublicHoliday } from '@/generated/prisma/client'
import type { AdminHolidayDto } from '@/modules/holidays/types/holiday.types'

export function toAdminHolidayDto(holiday: PublicHoliday): AdminHolidayDto {
  return { id: holiday.id, date: dateToIso(holiday.date), name: holiday.name }
}
