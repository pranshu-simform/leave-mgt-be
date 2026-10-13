import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { emailProvider } from '@/modules/email/providers/email.provider'
import { renderEmail } from '@/modules/email/templates/layout/email.layout'
import type { EmailDraft, EmailLogContext, Recipient } from '@/modules/email/types/email.types'

export async function sendEmail(
  to: Recipient,
  draft: EmailDraft,
  context: EmailLogContext = {},
): Promise<void> {
  const { html, text } = renderEmail(draft)
  if (!emailProvider) {
    logger.info(
      { ...context, to: to.email, subject: draft.subject },
      'Email switched off; not sent',
    )
    return
  }
  const sent = await emailProvider.send({
    from: env.EMAIL_FROM,
    to: { name: to.name, address: to.email },
    subject: draft.subject,
    html,
    text,
  })
  logger.info({ ...context, to: to.email, messageId: sent.id }, 'Email sent')
}

export function sendInBackground(context: EmailLogContext, task: () => Promise<void>): void {
  task().catch((err: unknown) => logger.error({ err, ...context }, 'Email failed'))
}

export async function verifyEmailProvider(): Promise<void> {
  if (!emailProvider) {
    logger.info('Email is switched off (EMAIL_PROVIDER is not set)')
    return
  }
  try {
    await emailProvider.verify()
    logger.info({ provider: emailProvider.name }, 'Email provider reachable')
  } catch (err) {
    logger.warn(
      { err, provider: emailProvider.name },
      'Email provider not reachable; emails will fail until it is',
    )
  }
}
