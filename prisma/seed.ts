import bcrypt from 'bcryptjs'
import { BCRYPT_COST } from '@/common/constants'
import { Role } from '@/generated/prisma/enums'
import { prisma } from '@/prisma/client'

const DEV_PASSWORD = 'Password@123'

const USERS = [
  {
    email: 'hr@example.com',
    name: 'Harper Hayes',
    role: Role.HR_ADMIN,
    isActive: true,
  },
  {
    email: 'manager@example.com',
    name: 'Morgan Miles',
    role: Role.MANAGER,
    isActive: true,
  },
  {
    email: 'employee@example.com',
    name: 'Elliot Evans',
    role: Role.EMPLOYEE,
    isActive: true,
  },
  {
    email: 'inactive@example.com',
    name: 'Indigo Ives',
    role: Role.EMPLOYEE,
    isActive: false,
  },
]

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, BCRYPT_COST)

  for (const user of USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: { ...user, passwordHash },
      update: { ...user, passwordHash },
    })
  }

  console.log(`Seeded ${USERS.length} users. Dev password for all: ${DEV_PASSWORD}`)
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
