import { APP_PATHS } from '@/modules/email/constants/email.constants'
import type { EmailTemplate, LeaveTemplateData } from '@/modules/email/types/email.types'
import {
  dateRange,
  firstName,
  leaveDetailRows,
  managerFooter,
} from '@/modules/email/utils/email.format'

export const leaveCancelledTemplate: EmailTemplate<LeaveTemplateData> = ({
  leave,
  recipient,
  appUrl,
}) => {
  const balance = leave.drawsFromBalance
    ? ` ${leave.days === 1 ? 'That working day is' : `Those ${leave.days} working days are`} back in their balance.`
    : ''
  return {
    subject: `${leave.employeeName} cancelled approved leave: ${dateRange(leave)}`,
    content: {
      preheader: `${leave.leaveTypeName}, ${dateRange(leave)} is cancelled.`,
      heading: `${leave.employeeName} cancelled approved leave`,
      greeting: `Hi ${firstName(recipient.name)},`,
      intro: `${leave.employeeName} cancelled ${leave.leaveTypeName} that was already approved.${balance} The team calendar is up to date.`,
      status: 'CANCELLED',
      statusNote: 'Was approved',
      rows: leaveDetailRows(leave, true),
      action: { label: 'Open team calendar', url: appUrl + APP_PATHS.CALENDAR },
      footer: managerFooter(leave),
    },
  }
}
