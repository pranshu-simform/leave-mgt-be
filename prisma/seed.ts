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
    managerEmail: null,
  },
  {
    email: 'manager@example.com',
    name: 'Morgan Miles',
    role: Role.MANAGER,
    managerEmail: 'hr@example.com',
  },
  {
    email: 'manager2@example.com',
    name: 'Quinn Quill',
    role: Role.MANAGER,
    managerEmail: 'hr@example.com',
  },
  {
    email: 'employee@example.com',
    name: 'Elliot Evans',
    role: Role.EMPLOYEE,
    managerEmail: 'manager@example.com',
  },
  {
    email: 'employee2@example.com',
    name: 'Rory Reed',
    role: Role.EMPLOYEE,
    managerEmail: 'manager2@example.com',
  },
  {
    email: 'inactive@example.com',
    name: 'Indigo Ives',
    role: Role.EMPLOYEE,
    managerEmail: 'manager@example.com',
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
    requiresApproval: true,
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
    requiresApproval: false,
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
    requiresApproval: true,
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
    requiresApproval: true,
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

  const ids = new Map<string, string>()
  for (const { managerEmail, isActive = true, ...user } of USERS) {
    const data = {
      ...user,
      isActive,
      managerId: managerEmail ? (ids.get(managerEmail) ?? null) : null,
      passwordHash,
    }
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      create: data,
      update: data,
    })
    ids.set(user.email, saved.id)
  }

  for (const type of LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { code: type.code },
      create: type,
      update: type,
    })
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
