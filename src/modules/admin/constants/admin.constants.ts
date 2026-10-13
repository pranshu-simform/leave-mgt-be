import { Role } from '@/generated/prisma/enums'

export const ADMIN_ROLES = [Role.HR_ADMIN] as const

export const LEAVE_TYPE_NAME_MAX_LENGTH = 60
export const LEAVE_DAYS_MAX = 365
export const HOLIDAY_NAME_MAX_LENGTH = 80
export const ADMIN_YEAR_MIN = 2000
export const ADMIN_YEAR_MAX = 2100
export const ADJUST_NOTE_MAX_LENGTH = 200
export const USER_SEARCH_MAX_LENGTH = 100
