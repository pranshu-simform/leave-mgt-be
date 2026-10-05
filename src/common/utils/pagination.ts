import type { Pagination } from '@/common/types/common.types'

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 25
export const MAX_LIMIT = 100

export function buildPagination(page: number, limit: number, total: number): Pagination {
  const totalPages = Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

export function toSkipTake(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit }
}
