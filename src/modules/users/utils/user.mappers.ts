import type { PublicUser, UserListItemDto, UserListRow } from '@/modules/users/types/user.types'

export function toPublicUser(user: PublicUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export function toUserListItemDto(row: UserListRow): UserListItemDto {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.isActive,
    manager: row.manager ? { id: row.manager.id, name: row.manager.name } : null,
  }
}
