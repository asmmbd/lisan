import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { validateSearchParams } from '@/lib/validation'

export const dynamic = 'force-dynamic'

const searchSchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  category: z.string().min(1).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(80).optional(),
})

export async function GET(request: NextRequest) {
  const parsed = validateSearchParams(request, searchSchema)
  if ('response' in parsed) return parsed.response
  const { q, category, limit, cursor } = parsed.data

  try {
    // Build where clause with proper Prisma typing
    const conditions: Record<string, unknown>[] = []

    if (q) {
      conditions.push(
        { arabic: { contains: q } },
        { bengali: { contains: q } },
        { pronunciation: { contains: q, mode: 'insensitive' } }
      )
    }

    if (category) {
      conditions.push({ categorySlug: category })
    }

    const where = conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : { AND: conditions }

    const [items, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        orderBy: { id: 'asc' },
        take: limit + 1,
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
    console.error('Error fetching vocabulary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vocabulary' },
      { status: 500 }
    )
  }
}
