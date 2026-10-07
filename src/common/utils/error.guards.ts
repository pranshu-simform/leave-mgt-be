import type { PostgresErrorInfo } from '@/common/types/common.types'

export function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string') {
    return err.type
  }
  return undefined
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function postgresError(err: unknown): PostgresErrorInfo | undefined {
  if (!isRecord(err) || !isRecord(err.meta) || !isRecord(err.meta.driverAdapterError)) return
  const cause = err.meta.driverAdapterError.cause
  if (isRecord(cause) && typeof cause.code === 'string' && typeof cause.message === 'string') {
    return { code: cause.code, message: cause.message }
  }
}
