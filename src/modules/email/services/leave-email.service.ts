import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { findUserById } from '@/modules/users'
import { sendEmail, sendInBackground } from '@/modules/email/services/email.service'
import { leaveApprovedTemplate } from '@/modules/email/templates/leave-approved.template'
import { leaveAutoApprovedTemplate } from '@/modules/email/templates/leave-auto-approved.template'
import { leaveCancelledTemplate } from '@/modules/email/templates/leave-cancelled.template'
import { leaveRejectedTemplate } from '@/modules/email/templates/leave-rejected.template'
import { leaveSubmittedTemplate } from '@/modules/email/templates/leave-submitted.template'
import type {
  EmailDraft,
  EmailTemplate,
  LeaveDecisionTemplateData,
  LeaveEmailData,
  LeaveTemplateData,
  Recipient,
} from '@/modules/email/types/email.types'

async function findRecipient(id: string | null): Promise<Recipient | null> {
  if (!id) return null
  const user = await findUserById(id)
  return user?.isActive ? { id: user.id, name: user.name, email: user.email } : null
}

function emailManager(leave: LeaveEmailData, template: EmailTemplate<LeaveTemplateData>): void {
  const context = { requestId: leave.requestId }
  sendInBackground(context, async () => {
    const manager = await findRecipient(leave.managerId)
    if (!manager) {
      logger.debug({ ...context, reason: 'no active manager' }, 'No email sent')
      return
    }
    const draft = template({
      leave,
      recipient: manager,
      appUrl: env.FRONTEND_ORIGIN,
    })
    await sendEmail(manager, draft, context)
  })
}

function emailEmployee(
  leave: LeaveEmailData,
  deciderId: string,
  build: (data: LeaveDecisionTemplateData) => EmailDraft,
): void {
  const context = { requestId: leave.requestId }
  sendInBackground(context, async () => {
    const employee = await findRecipient(leave.employeeId)
    if (!employee) {
      logger.debug({ ...context, reason: 'employee inactive' }, 'No email sent')
      return
    }
    const decider = await findUserById(deciderId)
    const draft = build({
      leave,
      recipient: employee,
      deciderName: decider?.name ?? 'Your manager',
      appUrl: env.FRONTEND_ORIGIN,
    })
    await sendEmail(employee, draft, context)
  })
}

export function sendLeaveSubmittedEmail(leave: LeaveEmailData): void {
  emailManager(leave, leaveSubmittedTemplate)
}

export function sendLeaveAutoApprovedEmail(leave: LeaveEmailData): void {
  emailManager(leave, leaveAutoApprovedTemplate)
}

export function sendLeaveCancelledEmail(leave: LeaveEmailData): void {
  emailManager(leave, leaveCancelledTemplate)
}

export function sendLeaveApprovedEmail(leave: LeaveEmailData, approverId: string): void {
  emailEmployee(leave, approverId, leaveApprovedTemplate)
}

export function sendLeaveRejectedEmail(
  leave: LeaveEmailData,
  approverId: string,
  reason: string,
): void {
  emailEmployee(leave, approverId, (data) => leaveRejectedTemplate({ ...data, reason }))
}
