import { addDays, isWeekend } from '@/common/utils/dates'
import type { DateWindow } from '@/modules/calendar/types/calendar.types'

export function peakAbsence({ from, to }: DateWindow, ranges: readonly DateWindow[]): number {
  let peak = -1
  for (let day = from; day <= to; day = addDays(day, 1)) {
    if (isWeekend(day)) continue
    const away = ranges.filter((range) => range.from <= day && range.to >= day).length
    peak = Math.max(peak, away)
  }
  return peak + 1
}
