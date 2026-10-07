import { Role } from '@/generated/prisma/enums'

export const APPROVER_ROLES = [Role.MANAGER, Role.HR_ADMIN] as const
export const REJECT_REASON_MAX_LENGTH = 500
