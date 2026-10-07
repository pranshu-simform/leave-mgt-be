import { z } from 'zod'
import { isoYear, todayIso } from '@/common/utils/dates'
import { BALANCE_YEAR_MAX, BALANCE_YEAR_MIN } from '@/modules/balances/constants/balance.constants'

export const balanceQuerySchema = z.object({
  year: z.coerce
    .number('Year must be a number')
    .int('Year must be a whole number')
    .min(BALANCE_YEAR_MIN, `Year must be ${BALANCE_YEAR_MIN} or later`)
    .max(BALANCE_YEAR_MAX, `Year must be ${BALANCE_YEAR_MAX} or earlier`)
    .default(() => isoYear(todayIso())),
})
