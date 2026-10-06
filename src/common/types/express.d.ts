import type { Role } from '@/generated/prisma/enums'

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; name: string; role: Role; managerId: string | null }
      validated?: { body?: unknown; query?: unknown; params?: unknown }
    }
  }
}
