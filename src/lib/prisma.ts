import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { env } from '../env.js'

declare global {
  var prismaClient: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

// `tsx watch` re-evaluates modules on every save, which would otherwise open a
// fresh connection pool per reload. Stash the client on `global` in dev so it
// survives across reloads; in production each process just gets its own.
export const prisma = globalThis.prismaClient ?? createClient()

if (env.NODE_ENV !== 'production') {
  globalThis.prismaClient = prisma
}
