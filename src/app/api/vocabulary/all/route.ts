import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateSearchParams } from '@/lib/validation'

export const dynamic = 'force-dynamic'

/**
 * Bulk vocabulary endpoint with cursor-based pagination.
 *
 * Query parameters (all optional):
 *   - cursor  : last vocabulary id from previous page
 *   - limit   : page size (1..100, default 20)
 *   - category: filter by category slug
 *   - all     : "1" to load a broad sample (no category filter)
 *
 * Response:
 *   { items: Vocabulary[], nextCursor: string | null, hasMore: boolean, total: number }
 */
const querySchema = z.object({
  cursor: z.string().min(1).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().min(1).max(80).optional(),
  all: z.enum(['0', '1']).optional(),
})

export async function GET(request: NextRequest) {
  const parsed = validateSearchParams(request, querySchema)
  if ('response' in parsed) return parsed.response
  const { cursor, limit, category, all } = parsed.data

  // "all=1" without category loads a broad sample across all categories.
  // Otherwise require a category or cursor to avoid dumping the entire table.
  if (all !== '1' && !category && !cursor) {
    return NextResponse.json(
      { error: 'Provide ?all=1, ?category=<slug>, or ?cursor=<id>' },
      { status: 400 }
    )
  }

  try {
    const where: { categorySlug?: string } = {}
    if (category) where.categorySlug = category

    const [items, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        orderBy: { id: 'asc' },
        take: limit + 1, // fetch one extra to know if more pages exist
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      }),
      prisma.vocabulary.count({ where }),
    ])

    const hasMore = items.length > limit
    const trimmed = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? trimmed[trimmed.length - 1]!.id : null

    return NextResponse.json({
      items: trimmed,
      nextCursor,
      hasMore,
      total,
    })
  } catch (error) {
    console.error('Error fetching vocabulary (all):', error)
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    )
  }
}
