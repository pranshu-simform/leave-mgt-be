import { AppError } from '@/common/errors/AppError'
import { ERROR_CODES } from '@/common/errors/errorCodes'
import { isCheckViolation } from '@/common/utils/error.guards'
import { BALANCE_AMOUNTS_CHECK } from '@/modules/balances/constants/balance.constants'

export function insufficientBalance(): AppError {
  return new AppError(
    ERROR_CODES.INSUFFICIENT_BALANCE,
    422,
    'Not enough leave balance to approve this request',
  )
}

export function isAmountsViolation(err: unknown): boolean {
  return isCheckViolation(err, BALANCE_AMOUNTS_CHECK)
}

export function toDeductError(err: unknown): unknown {
  return isAmountsViolation(err) ? insufficientBalance() : err
}
