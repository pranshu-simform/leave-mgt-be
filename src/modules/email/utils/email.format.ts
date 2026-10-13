import type { Role } from '@/generated/prisma/enums'
import type { EmailRow, LeaveEmailData } from '@/modules/email/types/email.types'

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

export function dateRange(leave: LeaveEmailData): string {
  return leave.startDate === leave.endDate
    ? leave.startDate
    : `${leave.startDate} → ${leave.endDate}`
}

export function dayCount(days: number): string {
  return `${days} working ${days === 1 ? 'day' : 'days'}`
}

export function leaveDetailRows(leave: LeaveEmailData, withEmployee: boolean): EmailRow[] {
  return [
    ...(withEmployee ? [{ label: 'Employee', value: leave.employeeName }] : []),
    { label: 'Leave type', value: leave.leaveTypeName },
    { label: 'Dates', value: dateRange(leave) },
    { label: 'Working days', value: String(leave.days) },
  ]
}

export function noteQuote(leave: LeaveEmailData): EmailRow | undefined {
  return leave.note
    ? { label: `Note from ${firstName(leave.employeeName)}`, value: leave.note }
    : undefined
}

export function managerFooter(leave: LeaveEmailData): string {
  return `You get this email because you are ${leave.employeeName}'s manager.`
}

const ROLE_LABELS: Record<Role, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  HR_ADMIN: 'HR admin',
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role]
}
