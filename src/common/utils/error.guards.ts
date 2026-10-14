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

export function isUniqueViolation(err: unknown, index?: string): boolean {
  if (!isRecord(err) || err.code !== 'P2002') return false
  if (!isRecord(err.meta) || !isRecord(err.meta.driverAdapterError)) return false
  const cause = err.meta.driverAdapterError.cause
  if (!isRecord(cause) || cause.kind !== 'UniqueConstraintViolation') return false
  return index === undefined || (isRecord(cause.constraint) && cause.constraint.index === index)
}

export function isExclusionViolation(err: unknown, constraint: string): boolean {
  const pgError = postgresError(err)
  return pgError?.code === '23P01' && pgError.message.includes(constraint)
}

export function isCheckViolation(err: unknown, constraint: string): boolean {
  const pgError = postgresError(err)
  return pgError?.code === '23514' && pgError.message.includes(constraint)
}
