import { Router } from 'express'
import { createRateLimiter } from '@/common/middleware/rateLimit.middleware'
import { validate } from '@/common/middleware/validate.middleware'
import * as authController from '@/modules/auth/auth.controller'
import { changePasswordSchema, loginSchema } from '@/modules/auth/auth.schema'

export const authPublicRouter = Router()
authPublicRouter.post(
  '/login',
  createRateLimiter(10),
  validate({ body: loginSchema }),
  authController.login,
)
authPublicRouter.post('/refresh', createRateLimiter(60), authController.refresh)

export const authRouter = Router()
authRouter.post('/logout', authController.logout)
authRouter.get('/me', authController.me)
authRouter.post(
  '/change-password',
  validate({ body: changePasswordSchema }),
  authController.changePassword,
)
