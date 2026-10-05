import { prisma, type Db } from '@/prisma/client'
import { userRepository } from '@/modules/users/user.repository'
import type { PublicUser } from '@/modules/users/user.types'

export function findUserByEmail(email: string) {
  return userRepository.findByEmail(prisma, email)
}

export function findUserById(id: string) {
  return userRepository.findById(prisma, id)
}

export function setPasswordHash(db: Db, id: string, passwordHash: string) {
  return userRepository.updatePasswordHash(db, id, passwordHash)
}

export function toPublicUser(user: PublicUser): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}
