import { addDays, isWeekend } from '@/common/utils/dates'

export function countWorkingDays(
  startDate: string,
  endDate: string,
  holidays: ReadonlySet<string>,
): number {
  let count = 0
  for (let day = startDate; day <= endDate; day = addDays(day, 1)) {
    if (!isWeekend(day) && !holidays.has(day)) count += 1
  }
  return count
}
