import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { VALIDATION_SOURCES } from '@/common/constants'
import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import type { ApiErrorDetail, ValidationSource } from '@/common/types/common.types'

export function validate(schemas: Partial<Record<ValidationSource, ZodType>>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const validated: NonNullable<Request['validated']> = {}
    const details: ApiErrorDetail[] = []

    for (const source of VALIDATION_SOURCES) {
      const schema = schemas[source]
      if (!schema) continue

      const result = schema.safeParse(req[source])
      if (result.success) {
        validated[source] = result.data
      } else {
        for (const issue of result.error.issues) {
          details.push({ field: issue.path.join('.') || source, message: issue.message })
        }
      }
    }

    if (details.length > 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, 400, 'Invalid request', details)
    }

    req.validated = validated
    next()
  }
}
