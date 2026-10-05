import type { Role } from '@/generated/prisma/enums'

export interface PublicUser {
  id: string
  email: string
  name: string
  role: Role
}
