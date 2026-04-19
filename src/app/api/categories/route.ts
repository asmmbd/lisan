import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [categories, sets] = await Promise.all([
      prisma.category.findMany({
        orderBy: { title: 'asc' },
      }),
      prisma.vocabularySet.findMany({
        orderBy: { createdAt: 'asc' },
      })
    ])

    return NextResponse.json({ 
      categories,
      sets
    })
  } catch (error) {
    console.error('Error fetching metadata:', error)
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}
