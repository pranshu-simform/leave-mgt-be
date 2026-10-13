import { APP_PATHS } from '@/modules/email/constants/email.constants'
import type { EmailTemplate, LeaveDecisionTemplateData } from '@/modules/email/types/email.types'
import { dateRange, dayCount, firstName, leaveDetailRows } from '@/modules/email/utils/email.format'

export const leaveApprovedTemplate: EmailTemplate<LeaveDecisionTemplateData> = ({
  leave,
  recipient,
  deciderName,
  appUrl,
}) => {
  const balance = leave.drawsFromBalance
    ? ` ${dayCount(leave.days)} ${leave.days === 1 ? 'was' : 'were'} taken from your balance.`
    : ''
  return {
    subject: `Your ${leave.leaveTypeName} is approved: ${dateRange(leave)}`,
    content: {
      preheader: `${deciderName} approved your leave.`,
      heading: 'Your leave is approved',
      greeting: `Hi ${firstName(recipient.name)},`,
      intro: `${deciderName} approved your ${leave.leaveTypeName} request.${balance}`,
      status: 'APPROVED',
      rows: [...leaveDetailRows(leave, false), { label: 'Decided by', value: deciderName }],
      action: {
        label: 'View request',
        url: appUrl + APP_PATHS.REQUEST(leave.requestId),
      },
      footer: 'You get this email because you asked for this leave.',
    },
  }
}
