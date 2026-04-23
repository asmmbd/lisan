import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [categories, sets, wordCounts] = await Promise.all([
      prisma.category.findMany({
        orderBy: { title: 'asc' },
      }),
      prisma.vocabularySet.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.vocabulary.groupBy({
        by: ['categorySlug'],
        _count: { id: true },
      }),
    ])

    // Attach word count to each category
    const countMap = Object.fromEntries(wordCounts.map((r) => [r.categorySlug, r._count.id]))
    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      wordCount: countMap[cat.slug] ?? 0,
    }))

    return NextResponse.json({ 
      categories: categoriesWithCount,
      sets,
    })
  } catch (error) {
    console.error('Error fetching metadata:', error)
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}

