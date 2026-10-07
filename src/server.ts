import { app } from '@/app'
import { SHUTDOWN_TIMEOUT_MS } from '@/common/constants'
import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { prisma } from '@/prisma/client'

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection')
  process.exit(1)
})
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception')
  process.exit(1)
})

try {
  await prisma.$queryRaw`SELECT 1`
} catch (err) {
  logger.fatal({ err }, 'Database is not reachable. Check DATABASE_URL and that Postgres is up.')
  process.exit(1)
}

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`)
})

server.on('error', (err) => {
  logger.fatal({ err }, 'HTTP server error')
  process.exit(1)
})

let shuttingDown = false

function shutdown(signal: string): void {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'Shutting down')

  setTimeout(() => {
    logger.error('Shutdown timed out, forcing exit')
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS).unref()

  server.close(() => {
    prisma
      .$disconnect()
      .catch((err: unknown) => logger.error({ err }, 'Error while disconnecting the database'))
      .finally(() => process.exit(0))
  })
  server.closeIdleConnections()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
