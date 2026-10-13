import { z } from 'zod'
import {
  LEAVE_DAYS_MAX,
  LEAVE_TYPE_CODE_PATTERN,
  LEAVE_TYPE_NAME_MAX_LENGTH,
} from '@/modules/admin/constants/admin.constants'

const name = z
  .string('Name is required')
  .trim()
  .min(1, 'Name is required')
  .max(LEAVE_TYPE_NAME_MAX_LENGTH, `Name must be at most ${LEAVE_TYPE_NAME_MAX_LENGTH} characters`)
const days = (label: string) =>
  z
    .number(`${label} must be a number`)
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`)
    .max(LEAVE_DAYS_MAX, `${label} must be at most ${LEAVE_DAYS_MAX}`)
const maxConsecutiveDays = z
  .number('Maximum days must be a number')
  .int('Maximum days must be a whole number')
  .min(1, 'Maximum days must be at least 1')
  .max(LEAVE_DAYS_MAX, `Maximum days must be at most ${LEAVE_DAYS_MAX}`)
  .nullable()

export const createLeaveTypeSchema = z.strictObject({
  code: z
    .string('Code is required')
    .trim()
    .regex(
      LEAVE_TYPE_CODE_PATTERN,
      'Use 2 to 30 capital letters, digits or underscores, starting with a letter',
    ),
  name,
  drawsFromBalance: z.boolean('Choose whether it draws from a balance'),
  defaultAllowanceDays: days('Allowance'),
  allowRetroactive: z.boolean().default(false),
  minNoticeDays: days('Notice').default(0),
  maxConsecutiveDays: maxConsecutiveDays.default(null),
  requiresNote: z.boolean().default(false),
  requiresApproval: z.boolean().default(true),
})

export const updateLeaveTypeSchema = z
  .strictObject({
    name: name.optional(),
    defaultAllowanceDays: days('Allowance').optional(),
    allowRetroactive: z.boolean().optional(),
    minNoticeDays: days('Notice').optional(),
    maxConsecutiveDays: maxConsecutiveDays.optional(),
    requiresNote: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Send at least one field to change',
    when: (payload) => payload.issues.length === 0,
  })
