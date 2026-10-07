import { UTCDate } from '@date-fns/utc'
import {
  addDays as addDaysTo,
  differenceInCalendarDays,
  format,
  getYear,
  isValid,
  endOfMonth,
  isWeekend as isWeekendDay,
  startOfMonth,
} from 'date-fns'
import { ISO_DATE, ISO_FORMAT } from '@/common/constants'
import type { IsoRange } from '@/common/types/common.types'

function parseIsoDate(iso: string): UTCDate {
  const date = new UTCDate(iso)
  if (!ISO_DATE.test(iso) || !isValid(date) || format(date, ISO_FORMAT) !== iso) {
    throw new Error(`Invalid ISO date: ${iso}`)
  }
  return date
}

export function isoToDate(iso: string): Date {
  return new Date(parseIsoDate(iso).getTime())
}

export function dateToIso(date: Date): string {
  return format(new UTCDate(date), ISO_FORMAT)
}

export function isValidIsoDate(iso: string): boolean {
  try {
    parseIsoDate(iso)
    return true
  } catch {
    return false
  }
}

export function todayIso(): string {
  return format(new UTCDate(), ISO_FORMAT)
}

export function addDays(iso: string, days: number): string {
  return format(addDaysTo(parseIsoDate(iso), days), ISO_FORMAT)
}

export function diffDays(from: string, to: string): number {
  return differenceInCalendarDays(parseIsoDate(to), parseIsoDate(from))
}

export function isoYear(iso: string): number {
  return getYear(parseIsoDate(iso))
}

export function monthBounds(month: string): IsoRange {
  const first = parseIsoDate(`${month}-01`)
  return {
    from: format(startOfMonth(first), ISO_FORMAT),
    to: format(endOfMonth(first), ISO_FORMAT),
  }
}

export function isWeekend(iso: string): boolean {
  return isWeekendDay(parseIsoDate(iso))
}
