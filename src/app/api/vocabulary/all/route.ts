import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// This endpoint serves vocabulary for home/quiz/practice screens
// It returns up to 500 words (not for dictionary search — use /api/vocabulary for that)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 500)

    const where: Record<string, unknown> = {}
    if (category) where.categorySlug = category

    const vocabulary = await prisma.vocabulary.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    return NextResponse.json({ vocabulary })
  } catch (error) {
    console.error('Error fetching vocabulary (all):', error)
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 })
  }
}
