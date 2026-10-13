import {
  APP_NAME,
  EMAIL_THEME as T,
  STATUS_BADGES,
} from '@/modules/email/constants/email.constants'
import {
  actionButton,
  detailsTable,
  quoteBlock,
  statusBadge,
} from '@/modules/email/templates/layout/email.components'
import type { EmailContent, EmailDraft, RenderedEmail } from '@/modules/email/types/email.types'
import { escapeHtml, font } from '@/modules/email/utils/email.html'

// The one scaffold every email uses: a template supplies the words (EmailContent), this file
// supplies the document, the branded header, the card, the footer and the plain-text part.
// Change the look of every email here; change one email's words in its template file.

function html(subject: string, content: EmailContent): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<style>
@media (max-width: 620px) {
  .container { width: 100% !important; }
  .px { padding-left: 20px !important; padding-right: 20px !important; }
}
@media (prefers-color-scheme: dark) {
  .bg-page { background-color: ${T.darkPage} !important; }
  .bg-card { background-color: ${T.darkCard} !important; border-color: ${T.darkBorder} !important; }
  .bg-sunken { background-color: ${T.darkSunken} !important; border-color: ${T.darkBorder} !important; }
  .fg-text { color: ${T.darkText} !important; }
  .fg-muted { color: ${T.darkMuted} !important; }
  .fg-link { color: ${T.darkLink} !important; }
}
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${T.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background-color:${T.page};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
<tr><td class="px" style="background-color:${T.primary};background-image:linear-gradient(135deg, ${T.brandFrom}, ${T.brandTo});border-radius:14px 14px 0 0;padding:20px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="width:30px;height:30px;border-radius:8px;background-color:#ffffff;text-align:center;vertical-align:middle;${font(15, 700, T.primary, 1)}">L</td>
<td style="padding-left:12px;${font(16, 600, '#ffffff', 1.2)}">${escapeHtml(APP_NAME)}</td>
</tr></table>
</td></tr>
<tr><td class="bg-card px" style="background-color:${T.card};border:1px solid ${T.border};border-top:0;border-radius:0 0 14px 14px;padding:32px;">
${statusBadge(content.status, content.statusNote)}
<h1 class="fg-text" style="margin:20px 0 12px;${font(22, 700, T.text, 1.3)}letter-spacing:-0.01em;">${escapeHtml(content.heading)}</h1>
<p class="fg-text" style="margin:0 0 6px;${font(15, 400, T.text)}">${escapeHtml(content.greeting)}</p>
<p class="fg-text" style="margin:0 0 24px;${font(15, 400, T.text)}">${escapeHtml(content.intro)}</p>
${detailsTable(content.rows)}
${quoteBlock(content.quote)}
${actionButton(content.action)}
</td></tr>
<tr><td class="px fg-muted" align="center" style="padding:20px 32px;${font(12, 400, T.muted)}">${escapeHtml(content.footer)}<br>${escapeHtml(APP_NAME)} sends this automatically; replies are not read.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

function text(content: EmailContent): string {
  const status = STATUS_BADGES[content.status].label
  const lines = [
    content.heading,
    '',
    content.greeting,
    '',
    content.intro,
    '',
    `Status: ${status}${content.statusNote ? ` (${content.statusNote})` : ''}`,
    ...content.rows.map((row) => `${row.label}: ${row.value}`),
  ]
  if (content.quote) lines.push('', `${content.quote.label}:`, content.quote.value)
  lines.push(
    '',
    `${content.action.label}: ${content.action.url}`,
    '',
    '--',
    content.footer,
    `${APP_NAME} sends this automatically; replies are not read.`,
  )
  return lines.join('\n')
}

export function renderEmail(draft: EmailDraft): RenderedEmail {
  return {
    html: html(draft.subject, draft.content),
    text: text(draft.content),
  }
}
