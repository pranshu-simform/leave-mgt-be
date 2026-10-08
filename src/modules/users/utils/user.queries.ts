import type { Prisma } from '@/generated/prisma/client'
import type { UserListFilters } from '@/modules/users/types/user.types'

// Prisma passes `contains` to LIKE as is, so a typed % or _ would act as a wildcard.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export function listWhere({ search, role, isActive }: UserListFilters): Prisma.UserWhereInput {
  const text = search ? escapeLike(search) : null
  return {
    ...(text
      ? {
          OR: [
            { name: { contains: text, mode: 'insensitive' } },
            { email: { contains: text, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(role ? { role } : {}),
    ...(isActive === undefined ? {} : { isActive }),
  }
}
