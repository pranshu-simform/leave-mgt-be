export const USER_LIST_RELATIONS = {
  manager: { select: { id: true, name: true } },
} as const

export const USER_EMAIL_INDEX = 'users_email_key'
