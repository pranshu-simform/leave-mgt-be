import { AppError } from '@/common/errors/AppError'
import type { RequestCheck } from '@/modules/leave-requests/types/leave-request.types'

export function throwIfInvalid(check: RequestCheck): void {
  const [first] = check.violations
  if (first) {
    throw new AppError(
      first.code,
      422,
      first.message,
      check.violations.map(({ field, message }) => ({ field, message })),
    )
  }
}
