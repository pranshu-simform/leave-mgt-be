import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_ORIGIN: z.url(),
  JWT_SECRET: z.string().min(32),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  EMAIL_PROVIDER: z.preprocess((value) => value || undefined, z.enum(['smtp']).optional()),
  EMAIL_FROM: z.string().min(3).default('Leave & Absence <leave-bot@leavepoc.local>'),
  SMTP_HOST: z.preprocess((value) => value || undefined, z.string().trim().optional()),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.preprocess((value) => value || undefined, z.string().optional()),
  SMTP_PASS: z.preprocess((value) => value || undefined, z.string().optional()),
})

const parsed = envSchema
  .superRefine((value, ctx) => {
    if (value.EMAIL_PROVIDER === 'smtp' && !value.SMTP_HOST) {
      ctx.addIssue({
        code: 'custom',
        path: ['SMTP_HOST'],
        message: 'Required when EMAIL_PROVIDER is smtp',
      })
    }
  })
  .safeParse(process.env)

if (!parsed.success) {
  const problems = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`)
  console.error(`Invalid environment variables:\n${problems.join('\n')}`)
  process.exit(1)
}

export const env = parsed.data
