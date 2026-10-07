export const NOTE_MAX_LENGTH = 500
export const REQUEST_YEAR_MIN = 2000
export const REQUEST_YEAR_MAX = 2100

export const LEAVE_REQUEST_RELATIONS = {
  leaveType: {
    select: { id: true, code: true, name: true, drawsFromBalance: true },
  },
  user: { select: { id: true, name: true, managerId: true } },
} as const

export const NO_OVERLAP_CONSTRAINT = 'leave_requests_no_overlap'
