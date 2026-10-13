import type { LeaveStatus } from '@/generated/prisma/enums'

// ---- Providers: the only contract the rest of the module knows about sending ----

export interface EmailAddress {
  name: string
  address: string
}

export interface EmailMessage {
  from: string
  to: EmailAddress
  subject: string
  html: string
  text: string
}

export interface SentEmail {
  id: string
}

export interface EmailProvider {
  readonly name: string
  send(message: EmailMessage): Promise<SentEmail>
  verify(): Promise<void>
}

export interface SmtpSettings {
  host: string
  port: number
  user?: string
  pass?: string
}

// ---- Templates: every email is content poured into the one shared layout ----

export interface EmailRow {
  label: string
  value: string
}

export interface EmailContent {
  preheader: string
  heading: string
  greeting: string
  intro: string
  status: LeaveStatus
  statusNote?: string
  rows: EmailRow[]
  quote?: EmailRow
  action: { label: string; url: string }
  footer: string
}

export interface EmailDraft {
  subject: string
  content: EmailContent
}

export type EmailTemplate<TData> = (data: TData) => EmailDraft

export interface RenderedEmail {
  html: string
  text: string
}

export interface BadgeStyle {
  label: string
  background: string
  color: string
}

export interface Recipient {
  id: string
  name: string
  email: string
}

// Extra fields written with every email log line (for example the request id).
export type EmailLogContext = Record<string, string>

// ---- Leave emails ----

// What a leave email needs to know about one request. Built by leave-requests after its commit.
export interface LeaveEmailData {
  requestId: string
  employeeId: string
  employeeName: string
  managerId: string | null
  leaveTypeName: string
  drawsFromBalance: boolean
  startDate: string
  endDate: string
  days: number
  note: string | null
}

// Template inputs: the leave, who reads the email, and anything specific to that email.
export interface LeaveTemplateData {
  leave: LeaveEmailData
  recipient: Recipient
  appUrl: string
}

export interface LeaveDecisionTemplateData extends LeaveTemplateData {
  deciderName: string
}

export interface LeaveRejectionTemplateData extends LeaveDecisionTemplateData {
  reason: string
}
