import cookieParser from 'cookie-parser'
import { Router } from 'express'
import { authenticate } from '@/common/middleware/auth.middleware'
import { approvalRouter } from '@/modules/approvals'
import { authPublicRouter, authRouter } from '@/modules/auth'
import { balanceRouter } from '@/modules/balances'
import { leaveRequestRouter } from '@/modules/leave-requests'
import { leaveTypeRouter } from '@/modules/leave-types'

export const v1Router = Router()

v1Router.use(cookieParser())

v1Router.use('/auth', authPublicRouter)

v1Router.use(authenticate)
v1Router.use('/auth', authRouter)
v1Router.use('/leave-types', leaveTypeRouter)
v1Router.use(balanceRouter)
v1Router.use('/leave-requests', leaveRequestRouter)
v1Router.use(approvalRouter)
