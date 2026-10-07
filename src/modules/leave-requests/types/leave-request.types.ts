import type { z } from 'zod'
import type { ErrorCode } from '@/common/errors/errorCodes'
import type { LeaveType, Prisma } from '@/generated/prisma/client'
import type { EventAction, LeaveStatus, Role } from '@/generated/prisma/enums'
import type { LEAVE_REQUEST_RELATIONS } from '@/modules/leave-requests/constants/leave-request.constants'
import type {
  createLeaveRequestSchema,
  historyQuerySchema,
  listLeaveRequestsQuerySchema,
  updateLeaveRequestSchema,
} from '@/modules/leave-requests/schemas/leave-request.schema'

export interface LeaveRequestDto {
  id: string
  leaveType: { id: string; code: string; name: string }
  startDate: string
  endDate: string
  days: number
  note: string | null
  status: LeaveStatus
  version: number
  requester: { id: string; name: string }
  decidedAt: string | null
  createdAt: string
}

export interface RequestEventDto {
  id: string
  action: EventAction
  fromStatus: LeaveStatus | null
  toStatus: LeaveStatus
  reason: string | null
  metadata: unknown
  createdAt: string
  actor: { id: string; name: string }
}

export type RequestViolationCode = Extract<
  ErrorCode,
  | 'CROSS_YEAR_RANGE'
  | 'NO_WORKING_DAYS'
  | 'RETROACTIVE_NOT_ALLOWED'
  | 'NOTICE_TOO_SHORT'
  | 'MAX_DAYS_EXCEEDED'
  | 'NOTE_REQUIRED'
  | 'INSUFFICIENT_BALANCE'
>

export interface RequestViolation {
  code: RequestViolationCode
  field: string
  message: string
}

export interface RequestCheck {
  days: number
  violations: RequestViolation[]
  balance: { allowance: number; used: number; remaining: number; remainingAfter: number } | null
}

export type LeaveRequestRow = Prisma.LeaveRequestGetPayload<{
  include: typeof LEAVE_REQUEST_RELATIONS
}>

export interface ListFilters {
  userId: string
  status?: LeaveStatus
  year?: number
  leaveTypeId?: string
  from?: string
}

export interface LeaveRequestActor {
  id: string
  role: Role
  managerId: string | null
}

export interface Approver {
  id: string
  role: Role
}

export interface ScopeActor {
  id: string
  role: Role
}

export interface CreateLeaveRequestData {
  userId: string
  leaveTypeId: string
  startDate: string
  endDate: string
  days: number
  note: string | null
}

export interface CreateEventData {
  requestId: string
  actorId: string
  action: EventAction
  fromStatus: LeaveStatus | null
  toStatus: LeaveStatus
  reason?: string
  metadata?: Prisma.InputJsonValue
}

export interface UpdateWhere {
  id: string
  userId: string
  version: number
}

export interface UpdateLeaveRequestData {
  startDate: string
  endDate: string
  days: number
  note: string | null
}

export interface OwnedRequestKey {
  id: string
  userId: string
}

export type DecisionStatus = 'APPROVED' | 'REJECTED'

export interface RequestInput {
  leaveTypeId: string
  startDate: string
  endDate: string
  note?: string
}

export interface CheckInput {
  startDate: string
  endDate: string
  note?: string
}

export interface EvaluatedRequest {
  type: LeaveType
  check: RequestCheck
}

export interface ApproverQuery {
  status: LeaveStatus
  page: number
  limit: number
}

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>
export type HistoryQuery = z.infer<typeof historyQuerySchema>
export type ListLeaveRequestsQuery = z.infer<typeof listLeaveRequestsQuerySchema>
