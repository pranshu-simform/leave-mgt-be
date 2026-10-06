import { UTCDate } from '@date-fns/utc'
import {
  addDays as addDaysTo,
  differenceInCalendarDays,
  format,
  getYear,
  isValid,
  isWeekend as isWeekendDay,
} from 'date-fns'

const ISO_FORMAT = 'yyyy-MM-dd'
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function parseIsoDate(iso: string): UTCDate {
  const date = new UTCDate(iso)
  if (!ISO_DATE.test(iso) || !isValid(date) || format(date, ISO_FORMAT) !== iso) {
    throw new Error(`Invalid ISO date: ${iso}`)
  }
  return date
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

export function isWeekend(iso: string): boolean {
  return isWeekendDay(parseIsoDate(iso))
}
