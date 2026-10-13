export { verifyEmailProvider } from '@/modules/email/services/email.service'
export {
  sendLeaveApprovedEmail,
  sendLeaveAutoApprovedEmail,
  sendLeaveCancelledEmail,
  sendLeaveRejectedEmail,
  sendLeaveSubmittedEmail,
} from '@/modules/email/services/leave-email.service'
export type { LeaveEmailData } from '@/modules/email/types/email.types'
