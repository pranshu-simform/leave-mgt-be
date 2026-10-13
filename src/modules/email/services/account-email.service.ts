import { env } from '@/config/env'
import type { Role } from '@/generated/prisma/enums'
import { SET_PASSWORD_TOKEN_TTL_SECONDS } from '@/common/constants'
import { APP_PATHS } from '@/modules/email/constants/email.constants'
import { sendEmail, sendInBackground } from '@/modules/email/services/email.service'
import { setPasswordTemplate } from '@/modules/email/templates/set-password.template'
import type { Recipient } from '@/modules/email/types/email.types'
import { roleLabel } from '@/modules/email/utils/email.format'

const SECONDS_PER_HOUR = 3600

export function sendSetPasswordEmail(
  recipient: Recipient,
  role: Role,
  creatorName: string,
  rawToken: string,
): void {
  sendInBackground({ userId: recipient.id }, async () => {
    const draft = setPasswordTemplate({
      recipient,
      creatorName,
      roleLabel: roleLabel(role),
      setPasswordUrl: `${env.FRONTEND_ORIGIN}${APP_PATHS.SET_PASSWORD}?token=${encodeURIComponent(rawToken)}`,
      validHours: SET_PASSWORD_TOKEN_TTL_SECONDS / SECONDS_PER_HOUR,
    })
    await sendEmail(recipient, draft, { userId: recipient.id })
  })
}
