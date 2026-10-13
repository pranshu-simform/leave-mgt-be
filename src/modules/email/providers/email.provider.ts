import { env } from '@/config/env'
import { createSmtpProvider } from '@/modules/email/providers/smtp.provider'
import type { EmailProvider } from '@/modules/email/types/email.types'

function createEmailProvider(): EmailProvider | null {
  switch (env.EMAIL_PROVIDER) {
    case 'smtp':
      return createSmtpProvider({
        host: env.SMTP_HOST!,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      })
    default:
      return null
  }
}

export const emailProvider = createEmailProvider()
