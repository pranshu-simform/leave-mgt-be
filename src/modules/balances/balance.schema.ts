import { z } from 'zod'
import { isoYear, todayIso } from '@/common/utils/dates'

export const balanceQuerySchema = z.object({
  year: z.coerce
    .number('Year must be a number')
    .int('Year must be a whole number')
    .min(2000, 'Year must be 2000 or later')
    .max(2100, 'Year must be 2100 or earlier')
    .default(() => isoYear(todayIso())),
})

export type BalanceQuery = z.infer<typeof balanceQuerySchema>
