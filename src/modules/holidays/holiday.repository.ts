import type { Db } from '@/prisma/client'

export interface HolidayRow {
  date: string
  name: string
}

export const holidayRepository = {
  findBetween: (db: Db, startDate: string, endDate: string) =>
    db.$queryRaw<HolidayRow[]>`
      SELECT to_char(date, 'YYYY-MM-DD') AS date, name
      FROM public_holidays
      WHERE date BETWEEN ${startDate}::date AND ${endDate}::date
      ORDER BY date`,

  findDatesBetween: async (db: Db, startDate: string, endDate: string): Promise<string[]> => {
    const rows = await db.$queryRaw<{ date: string }[]>`
      SELECT to_char(date, 'YYYY-MM-DD') AS date
      FROM public_holidays
      WHERE date BETWEEN ${startDate}::date AND ${endDate}::date`
    return rows.map((row) => row.date)
  },
}
