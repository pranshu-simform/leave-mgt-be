import { Router } from 'express'
import { createRateLimiter } from '@/common/middleware/rateLimit.middleware'
import { validate } from '@/common/middleware/validate.middleware'
import {
  LOGIN_RATE_LIMIT,
  REFRESH_RATE_LIMIT,
  SET_PASSWORD_RATE_LIMIT,
} from '@/modules/auth/constants/auth.constants'
import * as authController from '@/modules/auth/controllers/auth.controller'
import {
  changePasswordSchema,
  loginSchema,
  setPasswordSchema,
  setPasswordTokenSchema,
} from '@/modules/auth/schemas/auth.schema'

export const authPublicRouter = Router()
authPublicRouter.post(
  '/login',
  createRateLimiter(LOGIN_RATE_LIMIT),
  validate({ body: loginSchema }),
  authController.login,
)
authPublicRouter.post('/refresh', createRateLimiter(REFRESH_RATE_LIMIT), authController.refresh)

authPublicRouter.post(
  '/set-password/check',
  createRateLimiter(SET_PASSWORD_RATE_LIMIT),
  validate({ body: setPasswordTokenSchema }),
  authController.checkSetPasswordLink,
)
authPublicRouter.post(
  '/set-password',
  createRateLimiter(SET_PASSWORD_RATE_LIMIT),
  validate({ body: setPasswordSchema }),
  authController.setPassword,
)

export const authRouter = Router()
authRouter.post('/logout', authController.logout)
authRouter.get('/me', authController.me)
authRouter.post(
  '/change-password',
  validate({ body: changePasswordSchema }),
  authController.changePassword,
)
