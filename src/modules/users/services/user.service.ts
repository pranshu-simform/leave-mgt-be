import { buildPagination, toSkipTake } from '@/common/utils/pagination'
import { prisma, type Db } from '@/prisma/client'
import { toUserListItemDto } from '@/modules/users/utils/user.mappers'
import { userRepository } from '@/modules/users/repositories/user.repository'
import type { UserActor, UserListFilters } from '@/modules/users/types/user.types'

export function findUserByEmail(email: string) {
  return userRepository.findByEmail(prisma, email)
}

export function findUserById(id: string) {
  return userRepository.findById(prisma, id)
}

export function findUserInReadScope(actor: UserActor, id: string) {
  return userRepository.findInReadScope(prisma, id, actor)
}

export function setPasswordHash(db: Db, id: string, passwordHash: string) {
  return userRepository.updatePasswordHash(db, id, passwordHash)
}

export async function listUsers(filters: UserListFilters, page: number, limit: number) {
  const { skip, take } = toSkipTake(page, limit)
  const { items, total } = await userRepository.list(prisma, filters, skip, take)
  return { items: items.map(toUserListItemDto), pagination: buildPagination(page, limit, total) }
}
