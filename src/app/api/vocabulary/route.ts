import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const vocabulary = await prisma.vocabulary.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ vocabulary })
  } catch (error) {
    console.error('Error fetching vocabulary:', error)
    return NextResponse.json({ error: 'Failed to fetch vocabulary' }, { status: 500 })
  }
}
