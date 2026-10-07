import type { Db } from '@/prisma/client'
import type { HolidayDateRow, HolidayRow } from '@/modules/holidays/types/holiday.types'

export const holidayRepository = {
  findBetween: (db: Db, startDate: string, endDate: string) =>
    db.$queryRaw<HolidayRow[]>`
      SELECT to_char(date, 'YYYY-MM-DD') AS date, name
      FROM public_holidays
      WHERE date BETWEEN ${startDate}::date AND ${endDate}::date
      ORDER BY date`,

  findDatesBetween: async (db: Db, startDate: string, endDate: string): Promise<string[]> => {
    const rows = await db.$queryRaw<HolidayDateRow[]>`
      SELECT to_char(date, 'YYYY-MM-DD') AS date
      FROM public_holidays
      WHERE date BETWEEN ${startDate}::date AND ${endDate}::date`
    return rows.map((row) => row.date)
  },
}
