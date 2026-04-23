import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const category = searchParams.get('category') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    if (q) {
      where.OR = [
        { arabic: { contains: q } },
        { bengali: { contains: q } },
        { pronunciation: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.categorySlug = category
    }

    // If no query and no category, return empty (don't dump all words)
    if (!q && !category) {
      return NextResponse.json({ vocabulary: [], total: 0 })
    }

    const [vocabulary, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.vocabulary.count({ where }),
    ])

    return NextResponse.json({ vocabulary, total })
  } catch (error) {
    console.error('Error fetching vocabulary:', error)
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 })
  }
}
