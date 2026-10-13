import { isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'
import type {
  CreateHolidayData,
  HolidayDateRow,
  HolidayRow,
} from '@/modules/holidays/types/holiday.types'

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

  findByYear: async (db: Db, year: number, skip: number, take: number) => {
    const where = {
      date: { gte: isoToDate(`${year}-01-01`), lte: isoToDate(`${year}-12-31`) },
    }
    const [items, total] = await Promise.all([
      db.publicHoliday.findMany({ where, orderBy: { date: 'asc' }, skip, take }),
      db.publicHoliday.count({ where }),
    ])
    return { items, total }
  },

  create: (db: Db, { date, name }: CreateHolidayData) =>
    db.publicHoliday.create({ data: { date: isoToDate(date), name } }),

  deleteById: async (db: Db, id: string) => {
    const result = await db.publicHoliday.deleteMany({ where: { id } })
    return result.count === 1
  },
}
