import { createHash, randomBytes } from 'node:crypto'
import { REFRESH_TOKEN_BYTES } from '@/modules/auth/constants/auth.constants'

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url')
}
