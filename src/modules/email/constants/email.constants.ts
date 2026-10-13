import type { LeaveStatus } from '@/generated/prisma/enums'
import type { BadgeStyle } from '@/modules/email/types/email.types'

export const APP_NAME = 'Leave & Absence'

export const SMTP_TIMEOUT_MS = 10_000

export const EMAIL_THEME = {
  page: '#f6fbfc',
  card: '#ffffff',
  text: '#09161a',
  muted: '#4a5c5e',
  border: '#e1eaea',
  sunken: '#e2eeee',
  primary: '#007b7c',
  brandFrom: '#006962',
  brandTo: '#007c9b',
  tint: '#f2fdfc',
  // Dark mode
  darkPage: '#030d11',
  darkCard: '#0a181d',
  darkText: '#f1f6f7',
  darkMuted: '#a3b5b7',
  darkBorder: '#223134',
  darkSunken: '#132226',
  darkLink: '#3ed0c8',
} as const

export const EMAIL_FONT =
  "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export const STATUS_BADGES: Record<LeaveStatus, BadgeStyle> = {
  PENDING: { label: 'Pending', background: '#fff1bc', color: '#683c00' },
  APPROVED: { label: 'Approved', background: '#d8f9dd', color: '#0d4a22' },
  REJECTED: { label: 'Rejected', background: '#ffe5e1', color: '#94020d' },
  CANCELLED: { label: 'Cancelled', background: '#e9f0f0', color: '#364548' },
}

export const APP_PATHS = {
  APPROVALS: '/approvals',
  CALENDAR: '/calendar',
  SET_PASSWORD: '/set-password',
  REQUEST: (id: string) => `/requests/${id}`,
} as const
