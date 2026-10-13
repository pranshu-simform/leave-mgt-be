import { APP_PATHS } from '@/modules/email/constants/email.constants'
import type { EmailTemplate, LeaveTemplateData } from '@/modules/email/types/email.types'
import {
  dateRange,
  dayCount,
  firstName,
  leaveDetailRows,
  managerFooter,
  noteQuote,
} from '@/modules/email/utils/email.format'

export const leaveSubmittedTemplate: EmailTemplate<LeaveTemplateData> = ({
  leave,
  recipient,
  appUrl,
}) => ({
  subject: `${leave.employeeName} requested ${leave.leaveTypeName}: ${dateRange(leave)}`,
  content: {
    preheader: `${dayCount(leave.days)}, ${dateRange(leave)}. Waiting for your decision.`,
    heading: `${leave.employeeName} asked for time off`,
    greeting: `Hi ${firstName(recipient.name)},`,
    intro: `${leave.employeeName} requested ${leave.leaveTypeName} and is waiting for your decision.`,
    status: 'PENDING',
    statusNote: 'Needs your decision',
    rows: leaveDetailRows(leave, true),
    quote: noteQuote(leave),
    action: { label: 'Review request', url: appUrl + APP_PATHS.APPROVALS },
    footer: managerFooter(leave),
  },
})
