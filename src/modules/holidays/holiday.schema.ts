import { z } from 'zod'

export const holidayQuerySchema = z.object({
  month: z
    .string('Month is required')
    .regex(/^20\d{2}-(0[1-9]|1[0-2])$/, 'Enter a valid month (YYYY-MM)'),
})
export type HolidayQuery = z.infer<typeof holidayQuerySchema>
