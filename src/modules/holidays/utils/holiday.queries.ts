import { diffDays, isoToDate } from '@/common/utils/dates'

export function holidayWindow(from: string, to: string) {
  return {
    where: { date: { gte: isoToDate(from), lte: isoToDate(to) } },
    take: diffDays(from, to) + 1,
  }
}
