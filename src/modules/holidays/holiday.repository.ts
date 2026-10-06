import type { Db } from '@/prisma/client'

export const holidayRepository = {
  findDatesBetween: async (db: Db, startDate: string, endDate: string): Promise<string[]> => {
    const rows = await db.$queryRaw<{ date: string }[]>`
      SELECT to_char(date, 'YYYY-MM-DD') AS date
      FROM public_holidays
      WHERE date BETWEEN ${startDate}::date AND ${endDate}::date`
    return rows.map((row) => row.date)
  },
}
