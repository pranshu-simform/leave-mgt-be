import { z } from 'zod'
import { paginationQuerySchema } from '@/common/validators/common.schema'

const month = z
  .string('Month is required')
  .regex(/^20\d{2}-(0[1-9]|1[0-2])$/, 'Enter a valid month (YYYY-MM)')

export const calendarQuerySchema = paginationQuerySchema.extend({
  month,
  managerId: z.uuid('Invalid manager').optional(),
  status: z.enum(['PENDING', 'APPROVED']).optional(),
})
export type CalendarQuery = z.infer<typeof calendarQuerySchema>

export const summaryQuerySchema = paginationQuerySchema.extend({
  month,
  managerId: z.uuid('Invalid manager').optional(),
})
export type SummaryQuery = z.infer<typeof summaryQuerySchema>
