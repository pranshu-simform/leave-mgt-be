import cors from 'cors'
import express from 'express'
import { errorHandler } from './middleware/error-handler.js'
import { notFound } from './middleware/not-found.js'
import { healthRouter } from './routes/health.routes.js'
import { userRouter } from './routes/user.routes.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/health', healthRouter)
app.use('/users', userRouter)

app.use(notFound)
app.use(errorHandler)
