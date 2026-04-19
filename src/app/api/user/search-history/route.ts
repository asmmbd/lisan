import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's search history
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const history = await prisma.searchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20, // Last 20 searches
    })

    return NextResponse.json({ history: history.map(h => h.term) })
  } catch (error) {
    console.error('Error fetching search history:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST - Add search term
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { term } = await req.json()

    // Delete duplicate if exists
    await prisma.searchHistory.deleteMany({
      where: { userId: session.user.id, term }
    })

    // Add new search
    await prisma.searchHistory.create({
      data: {
        userId: session.user.id,
        term,
      }
    })

    // Clean old searches (keep only 20)
    const oldSearches = await prisma.searchHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip: 20,
    })

    for (const search of oldSearches) {
      await prisma.searchHistory.delete({ where: { id: search.id } })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding search:', error)
    return NextResponse.json({ error: 'Failed to add' }, { status: 500 })
  }
}

// DELETE - Clear history
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.searchHistory.deleteMany({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing history:', error)
    return NextResponse.json({ error: 'Failed to clear' }, { status: 500 })
  }
}
