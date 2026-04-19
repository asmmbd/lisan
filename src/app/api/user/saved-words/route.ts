import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch user's saved words
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const savedWords = await prisma.savedWord.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ savedWords: savedWords.map(w => w.wordId) })
  } catch (error) {
    console.error('Error fetching saved words:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST - Toggle save word
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wordId } = await req.json()

    // Check if already saved
    const existing = await prisma.savedWord.findUnique({
      where: { userId_wordId: { userId: session.user.id, wordId } }
    })

    if (existing) {
      // Remove (unsave)
      await prisma.savedWord.delete({
        where: { userId_wordId: { userId: session.user.id, wordId } }
      })
      return NextResponse.json({ saved: false, wordId })
    } else {
      // Add (save)
      await prisma.savedWord.create({
        data: { userId: session.user.id, wordId }
      })
      return NextResponse.json({ saved: true, wordId })
    }
  } catch (error) {
    console.error('Error toggling save word:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
