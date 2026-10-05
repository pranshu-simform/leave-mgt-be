import { PrismaPg } from '@prisma/adapter-pg'
import { Prisma, PrismaClient } from '@/generated/prisma/client'
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

export type Db = Prisma.TransactionClient | PrismaClient

export function withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(fn)
}
