import type { Prisma } from '@/generated/prisma/client'
import type { Role } from '@/generated/prisma/enums'
import type { USER_LIST_RELATIONS } from '@/modules/users/constants/user.constants'

export interface PublicUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface UserActor {
  id: string
  role: Role
}

export type UserListRow = Prisma.UserGetPayload<{
  include: typeof USER_LIST_RELATIONS
}>

export interface UserListFilters {
  search?: string
  role?: Role
  isActive?: boolean
}

export interface CreateUserData {
  email: string
  name: string
  role: Role
  managerId: string | null
}

export interface UserListItemDto {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  hasPassword: boolean
  manager: { id: string; name: string } | null
}
