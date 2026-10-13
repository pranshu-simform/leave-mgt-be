import type { EmailTemplate, SetPasswordTemplateData } from '@/modules/email/types/email.types'
import { firstName } from '@/modules/email/utils/email.format'

export const setPasswordTemplate: EmailTemplate<SetPasswordTemplateData> = ({
  recipient,
  creatorName,
  roleLabel,
  setPasswordUrl,
  validHours,
}) => ({
  subject: 'Set your password for Leave & Absence',
  content: {
    preheader: `${creatorName} created your account. Set a password to sign in.`,
    heading: 'Set your password',
    greeting: `Hi ${firstName(recipient.name)},`,
    intro: `${creatorName} created an account for you. Choose a password to finish setting it up. The link works once and for ${validHours} hours.`,
    rows: [
      { label: 'Email', value: recipient.email },
      { label: 'Role', value: roleLabel },
    ],
    action: { label: 'Set your password', url: setPasswordUrl },
    footer: `If you were not expecting this, ignore this email: nothing changes until a password is set.`,
  },
})
