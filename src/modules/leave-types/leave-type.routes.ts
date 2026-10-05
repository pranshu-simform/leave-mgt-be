import { Router } from 'express'
import * as leaveTypeController from '@/modules/leave-types/leave-type.controller'

export const leaveTypeRouter = Router()
leaveTypeRouter.get('/', leaveTypeController.list)
