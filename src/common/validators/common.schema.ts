import { z } from 'zod'
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '@/common/utils/pagination'

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export const idParamSchema = z.object({ id: z.uuid('Invalid id') })

export type IdParam = z.infer<typeof idParamSchema>
