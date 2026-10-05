import cookieParser from 'cookie-parser'
import { Router } from 'express'
import { authenticate } from '@/common/middleware/auth.middleware'
import { authPublicRouter, authRouter } from '@/modules/auth'

export const v1Router = Router()

v1Router.use(cookieParser())

v1Router.use('/auth', authPublicRouter)

v1Router.use(authenticate)
v1Router.use('/auth', authRouter)
