import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

export const userRouter = Router()

const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
})

// GET /users - list, newest first. Example of the Express -> Prisma -> Postgres path;
// not how the real employee/leave endpoints will be shaped.
userRouter.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  res.status(200).json({ data: users })
})

// A thrown/rejected error here is forwarded to errorHandler automatically -
// Express 5 catches async handler rejections without an explicit try/catch.
userRouter.post('/', async (req, res) => {
  const body = createUserSchema.parse(req.body)
  const user = await prisma.user.create({ data: body })
  res.status(201).json({ data: user })
})
