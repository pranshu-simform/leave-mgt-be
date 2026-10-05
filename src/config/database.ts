import { env } from '@/config/env'

export const poolConfig = {
  connectionString: env.DATABASE_URL,
  max: env.DATABASE_POOL_MAX,
}
