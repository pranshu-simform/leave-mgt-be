import type { LeaveStatus } from '@/generated/prisma/enums'
import { EMAIL_THEME as T, STATUS_BADGES } from '@/modules/email/constants/email.constants'
import type { EmailContent, EmailRow } from '@/modules/email/types/email.types'
import { escapeHtml, font, keepDatesWhole, multiline } from '@/modules/email/utils/email.html'

// Reusable, email-safe building blocks (tables and inline styles). The layout composes them;
// every block escapes what it is given.

export function statusBadge(status: LeaveStatus, note?: string): string {
  const style = STATUS_BADGES[status]
  const caption = note
    ? `<td class="fg-muted" style="padding-left:10px;${font(13, 400, T.muted)}">${escapeHtml(note)}</td>`
    : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="background-color:${style.background};border-radius:999px;padding:4px 12px;${font(12, 700, style.color, 1.4)}letter-spacing:0.05em;text-transform:uppercase;">${style.label}</td>${caption}
</tr></table>`
}

export function detailsTable(rows: EmailRow[]): string {
  const cells = rows
    .map(
      (row) => `<tr>
<td class="fg-muted" valign="top" style="padding:5px 16px 5px 0;width:120px;${font(13, 400, T.muted)}">${escapeHtml(row.label)}</td>
<td class="fg-text" valign="top" style="padding:5px 0;${font(15, 600, T.text)}">${keepDatesWhole(escapeHtml(row.value))}</td>
</tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-sunken" style="background-color:${T.tint};border:1px solid ${T.border};border-radius:10px;">
<tr><td style="padding:14px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table></td></tr>
</table>`
}

export function quoteBlock(quote?: EmailRow): string {
  if (!quote) return ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
<tr><td style="border-left:3px solid ${T.primary};padding:2px 0 2px 16px;">
<p class="fg-muted" style="margin:0 0 4px;${font(12, 700, T.muted)}letter-spacing:0.05em;text-transform:uppercase;">${escapeHtml(quote.label)}</p>
<p class="fg-text" style="margin:0;${font(15, 400, T.text)}">${multiline(quote.value)}</p>
</td></tr>
</table>`
}

// A table-cell button: the shape survives Outlook, which ignores padding on links.
export function actionButton(action: EmailContent['action']): string {
  const url = escapeHtml(action.url)
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
<tr><td style="border-radius:8px;background-color:${T.primary};">
<a href="${url}" style="display:inline-block;padding:12px 22px;border-radius:8px;${font(15, 600, '#ffffff', 1)}text-decoration:none;">${escapeHtml(action.label)}</a>
</td></tr>
</table>
<p class="fg-muted" style="margin:16px 0 0;${font(13, 400, T.muted)}">Or paste this link into your browser: <a class="fg-link" href="${url}" style="color:${T.primary};word-break:break-all;">${url}</a></p>`
}
