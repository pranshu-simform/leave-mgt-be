import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

// Express only recognizes this as an error-handling middleware because it takes 4 args.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Invalid request',
        issues: err.issues,
      },
    })
    return
  }

  const message = err instanceof Error ? err.message : 'Unexpected error'
  console.error(err)

  res.status(500).json({
    error: { message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message },
  })
}
