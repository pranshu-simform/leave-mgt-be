import { z } from 'zod'
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/modules/auth/constants/auth.constants'

const email = z
  .string('Email is required')
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'))

export const loginSchema = z.object({
  email,
  password: z
    .string('Password is required')
    .min(1, 'Password is required')
    .max(PASSWORD_MAX_LENGTH, 'Password is too long'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string('Current password is required')
      .min(1, 'Current password is required')
      .max(PASSWORD_MAX_LENGTH),
    newPassword: z
      .string('New password is required')
      .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`),
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current password',
  })
