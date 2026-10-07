export interface RequestMeta {
  userAgent?: string
  ip?: string
}

export interface IssuedSession {
  accessToken: string
  refreshToken: string
}
