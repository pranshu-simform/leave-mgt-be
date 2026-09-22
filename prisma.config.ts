import { defineConfig, env } from 'prisma/config'

try {
  process.loadEnvFile('.env')
} catch {
  // No .env file yet (e.g. `prisma generate` before local setup) - fine, DATABASE_URL
  // just needs to be set some other way for anything that touches the database.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
