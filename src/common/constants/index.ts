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

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 25
export const MAX_LIMIT = 100

export const ISO_FORMAT = 'yyyy-MM-dd'
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const VALIDATION_SOURCES = ['body', 'query', 'params'] as const

export const SHUTDOWN_TIMEOUT_MS = 10_000
