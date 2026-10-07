import type { Pagination, SkipTake } from '@/common/types/common.types'

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

export function toSkipTake(page: number, limit: number): SkipTake {
  return { skip: (page - 1) * limit, take: limit }
}
