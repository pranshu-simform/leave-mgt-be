import { dateToIso, isoToDate } from '@/common/utils/dates'
import type { Db } from '@/prisma/client'
import type { CreateHolidayData, HolidayRow } from '@/modules/holidays/types/holiday.types'
import { holidayWindow } from '@/modules/holidays/utils/holiday.queries'

export const holidayRepository = {
  findBetween: async (db: Db, startDate: string, endDate: string): Promise<HolidayRow[]> => {
    const rows = await db.publicHoliday.findMany({
      ...holidayWindow(startDate, endDate),
      select: { date: true, name: true },
      orderBy: { date: 'asc' },
    })
    return rows.map((row) => ({ date: dateToIso(row.date), name: row.name }))
  },

  findDatesBetween: async (db: Db, startDate: string, endDate: string): Promise<string[]> => {
    const rows = await db.publicHoliday.findMany({
      ...holidayWindow(startDate, endDate),
      select: { date: true },
    })
    return rows.map((row) => dateToIso(row.date))
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
