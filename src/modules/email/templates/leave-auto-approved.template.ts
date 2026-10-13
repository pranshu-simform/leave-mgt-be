import { APP_PATHS } from '@/modules/email/constants/email.constants'
import type { EmailTemplate, LeaveTemplateData } from '@/modules/email/types/email.types'
import {
  dateRange,
  firstName,
  leaveDetailRows,
  managerFooter,
  noteQuote,
} from '@/modules/email/utils/email.format'

export const leaveAutoApprovedTemplate: EmailTemplate<LeaveTemplateData> = ({
  leave,
  recipient,
  appUrl,
}) => ({
  subject: `${leave.employeeName} is off: ${leave.leaveTypeName}, ${dateRange(leave)}`,
  content: {
    preheader: `Approved automatically. Nothing for you to do.`,
    heading: `${leave.employeeName} will be away`,
    greeting: `Hi ${firstName(recipient.name)},`,
    intro: `${leave.leaveTypeName} does not need approval, so ${leave.employeeName}'s request was approved straight away. Nothing for you to do; this is a heads-up for planning.`,
    status: 'APPROVED',
    statusNote: 'Approved automatically',
    rows: leaveDetailRows(leave, true),
    quote: noteQuote(leave),
    action: { label: 'Open team calendar', url: appUrl + APP_PATHS.CALENDAR },
    footer: managerFooter(leave),
  },
})
