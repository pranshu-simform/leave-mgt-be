import { createTransport } from 'nodemailer'
import { SMTP_TIMEOUT_MS } from '@/modules/email/constants/email.constants'
import type { EmailProvider, SmtpSettings } from '@/modules/email/types/email.types'

export function createSmtpProvider(settings: SmtpSettings): EmailProvider {
  const transporter = createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: settings.user ? { user: settings.user, pass: settings.pass } : undefined,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  })

  return {
    name: `smtp (${settings.host}:${settings.port})`,
    async send(message) {
      const info = await transporter.sendMail({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      })
      return { id: info.messageId }
    },
    async verify() {
      await transporter.verify()
    },
  }
}
