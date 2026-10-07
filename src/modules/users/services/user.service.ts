import { prisma, type Db } from '@/prisma/client'
import { userRepository } from '@/modules/users/repositories/user.repository'
import type { UserActor } from '@/modules/users/types/user.types'

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
