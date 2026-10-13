import { buildPagination, toSkipTake } from '@/common/utils/pagination'
import { prisma, type Db } from '@/prisma/client'
import { toUserListItemDto } from '@/modules/users/utils/user.mappers'
import { userRepository } from '@/modules/users/repositories/user.repository'
import type { CreateUserData, UserActor, UserListFilters } from '@/modules/users/types/user.types'
import { invalidManager, toUserError } from '@/modules/users/utils/user.errors'

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

export function setInitialPasswordHash(db: Db, id: string, passwordHash: string) {
  return userRepository.setInitialPasswordHash(db, id, passwordHash)
}

export async function createUser(db: Db, data: CreateUserData) {
  if (data.managerId) {
    const manager = await userRepository.findById(db, data.managerId)
    if (!manager?.isActive || manager.role === 'EMPLOYEE') throw invalidManager()
  }
  return userRepository.create(db, data).catch((err: unknown) => {
    throw toUserError(err)
  })
}

export async function listUsers(filters: UserListFilters, page: number, limit: number) {
  const { skip, take } = toSkipTake(page, limit)
  const { items, total } = await userRepository.list(prisma, filters, skip, take)
  return {
    items: items.map(toUserListItemDto),
    pagination: buildPagination(page, limit, total),
  }
}
