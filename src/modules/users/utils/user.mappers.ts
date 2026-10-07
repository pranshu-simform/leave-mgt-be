import type { PublicUser } from '@/modules/users/types/user.types'

export function toPublicUser(user: PublicUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}
