export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const

export const COOKIE_PATHS = {
  ACCESS_TOKEN: '/api',
  REFRESH_TOKEN: '/api/v1/auth',
} as const

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60

export const BCRYPT_COST = 10

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
export const API_RATE_LIMIT = 600
