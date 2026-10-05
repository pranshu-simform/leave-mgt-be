export interface LeaveTypeDto {
  id: string
  code: string
  name: string
  drawsFromBalance: boolean
  defaultAllowanceDays: number
  allowRetroactive: boolean
  minNoticeDays: number
  maxConsecutiveDays: number | null
  requiresNote: boolean
}
