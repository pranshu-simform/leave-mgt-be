import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { poolConfig } from '@/config/database'
import { env } from '@/config/env'

declare global {
  var prismaClient: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const adapter = new PrismaPg(poolConfig)
  return new PrismaClient({ adapter })
}

export const prisma = globalThis.prismaClient ?? createClient()

if (env.NODE_ENV !== 'production') {
  globalThis.prismaClient = prisma
}
