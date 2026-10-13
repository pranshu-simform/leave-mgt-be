export { verifyEmailProvider } from '@/modules/email/services/email.service'
export { sendSetPasswordEmail } from '@/modules/email/services/account-email.service'
export {
  sendLeaveApprovedEmail,
  sendLeaveAutoApprovedEmail,
  sendLeaveCancelledEmail,
  sendLeaveRejectedEmail,
  sendLeaveSubmittedEmail,
} from '@/modules/email/services/leave-email.service'
export type { LeaveEmailData } from '@/modules/email/types/email.types'
