import bcrypt from 'bcryptjs'
import { BCRYPT_COST } from '@/common/constants'
import { Role } from '@/generated/prisma/enums'
import { isoYear, todayIso } from '@/common/utils/dates'
import { prisma } from '@/prisma/client'
import { allocateYear } from '@/modules/balances'

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

const LEAVE_TYPES = [
  {
    code: 'ANNUAL',
    name: 'Annual leave',
    drawsFromBalance: true,
    defaultAllowanceDays: 20,
    allowRetroactive: false,
    minNoticeDays: 3,
    maxConsecutiveDays: 15,
    requiresNote: false,
  },
  {
    code: 'SICK',
    name: 'Sick leave',
    drawsFromBalance: true,
    defaultAllowanceDays: 10,
    allowRetroactive: true,
    minNoticeDays: 0,
    maxConsecutiveDays: null,
    requiresNote: false,
  },
  {
    code: 'UNPAID',
    name: 'Unpaid leave',
    drawsFromBalance: false,
    defaultAllowanceDays: 0,
    allowRetroactive: false,
    minNoticeDays: 7,
    maxConsecutiveDays: null,
    requiresNote: true,
  },
  {
    code: 'PARENTAL',
    name: 'Parental leave',
    drawsFromBalance: true,
    defaultAllowanceDays: 30,
    allowRetroactive: false,
    minNoticeDays: 14,
    maxConsecutiveDays: 30,
    requiresNote: false,
  },
]

const PUBLIC_HOLIDAYS = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-05-01', name: 'Labour Day' },
  { date: '2026-10-14', name: 'Company Foundation Day' },
  { date: '2026-12-25', name: 'Christmas Day' },
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

  for (const type of LEAVE_TYPES) {
    await prisma.leaveType.upsert({ where: { code: type.code }, create: type, update: type })
  }

  for (const holiday of PUBLIC_HOLIDAYS) {
    const date = new Date(`${holiday.date}T00:00:00.000Z`)
    await prisma.publicHoliday.upsert({
      where: { date },
      create: { date, name: holiday.name },
      update: { name: holiday.name },
    })
  }

  const year = isoYear(todayIso())
  const allocated = await allocateYear(year)

  console.log(
    `Seeded ${LEAVE_TYPES.length} leave types, ${PUBLIC_HOLIDAYS.length} holidays, ${allocated} new ${year} balances.`,
  )
  console.log(`Seeded ${USERS.length} users. Dev password for all: ${DEV_PASSWORD}`)
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
