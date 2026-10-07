import { z } from 'zod'
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '@/common/constants'
import { isValidIsoDate } from '@/common/utils/dates'

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
})

export const isoDateSchema = z
  .string('Date is required')
  .refine(isValidIsoDate, 'Enter a valid date (YYYY-MM-DD)')

export const idParamSchema = z.object({ id: z.uuid('Invalid id') })
