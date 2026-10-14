import { addDays, isWeekend } from '@/common/utils/dates'

export function nextWorkingDays(
  from: string,
  count: number,
  windowDays: number,
  holidays: ReadonlySet<string>,
): string[] {
  const days: string[] = []
  const last = addDays(from, windowDays)
  for (let day = from; day <= last && days.length < count; day = addDays(day, 1)) {
    if (!isWeekend(day) && !holidays.has(day)) days.push(day)
  }
  return days
}
