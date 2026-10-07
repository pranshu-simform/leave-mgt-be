import type { z } from 'zod'
import type { holidayQuerySchema } from '@/modules/holidays/schemas/holiday.schema'

export interface HolidayRow {
  date: string
  name: string
}

export interface HolidayDateRow {
  date: string
}

export type HolidayQuery = z.infer<typeof holidayQuerySchema>
