import { z } from 'zod'

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
    .max(72, 'Password is too long'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string('Current password is required')
      .min(1, 'Current password is required')
      .max(72),
    newPassword: z
      .string('New password is required')
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current password',
  })
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
