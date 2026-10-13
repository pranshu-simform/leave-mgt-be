export const MAX_OVERLAPPING = 100
export const MAX_TEAMS = 200

export const CALENDAR_REQUEST_SELECT = {
  id: true,
  startDate: true,
  endDate: true,
  status: true,
  user: { select: { id: true, name: true } },
  leaveType: { select: { id: true, name: true } },
} as const

export const TEAM_SELECT = {
  id: true,
  name: true,
  _count: { select: { reports: { where: { isActive: true } } } },
} as const
