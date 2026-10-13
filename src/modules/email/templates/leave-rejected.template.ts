import { APP_PATHS } from '@/modules/email/constants/email.constants'
import type { EmailTemplate, LeaveRejectionTemplateData } from '@/modules/email/types/email.types'
import { dateRange, firstName, leaveDetailRows } from '@/modules/email/utils/email.format'

export const leaveRejectedTemplate: EmailTemplate<LeaveRejectionTemplateData> = ({
  leave,
  recipient,
  deciderName,
  reason,
  appUrl,
}) => {
  const balance = leave.drawsFromBalance ? ' Nothing was taken from your balance.' : ''
  return {
    subject: `Your ${leave.leaveTypeName} was not approved: ${dateRange(leave)}`,
    content: {
      preheader: `${deciderName} did not approve your leave.`,
      heading: 'Your leave request was not approved',
      greeting: `Hi ${firstName(recipient.name)},`,
      intro: `${deciderName} rejected your ${leave.leaveTypeName} request.${balance}`,
      status: 'REJECTED',
      rows: [...leaveDetailRows(leave, false), { label: 'Decided by', value: deciderName }],
      quote: { label: `Reason from ${firstName(deciderName)}`, value: reason },
      action: {
        label: 'View request',
        url: appUrl + APP_PATHS.REQUEST(leave.requestId),
      },
      footer: 'You get this email because you asked for this leave.',
    },
  }
}
