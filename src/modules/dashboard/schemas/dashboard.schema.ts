import { z } from 'zod'
import { isoYear, todayIso } from '@/common/utils/dates'
import {
  DASHBOARD_YEAR_MAX,
  DASHBOARD_YEAR_MIN,
} from '@/modules/dashboard/constants/dashboard.constants'

export const dashboardQuerySchema = z.object({
  year: z.coerce
    .number('Year must be a number')
    .int('Year must be a whole number')
    .min(DASHBOARD_YEAR_MIN, `Year must be ${DASHBOARD_YEAR_MIN} or later`)
    .max(DASHBOARD_YEAR_MAX, `Year must be ${DASHBOARD_YEAR_MAX} or earlier`)
    .default(() => isoYear(todayIso())),
})
