import { EMAIL_FONT } from '@/modules/email/constants/email.constants'

// Names, notes and reasons are typed by users: everything dynamic goes through here.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function multiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br>')
}

// A narrow screen may wrap a date range, but never in the middle of one date.
export function keepDatesWhole(escaped: string): string {
  return escaped.replace(/\d{4}-\d{2}-\d{2}/g, '<span style="white-space:nowrap;">$&</span>')
}

// Email clients drop <style> blocks unpredictably, so every element carries its own inline font.
export function font(size: number, weight: number, color: string, lineHeight = 1.6): string {
  return `font-family:${EMAIL_FONT};font-size:${size}px;font-weight:${weight};line-height:${lineHeight};color:${color};`
}
