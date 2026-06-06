import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { noteCreateSchema, noteDeleteSchema, validateBody } from '@/lib/validation'

// GET - Fetch user's notes
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST - Add note
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateBody(req, noteCreateSchema)
    if ('response' in validation) return validation.response
    const { text } = validation.data

    const note = await prisma.note.create({
      data: {
        userId: session.user.id,
        text,
      }
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Error adding note:', error)
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
  }
}

// DELETE - Delete note
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateBody(req, noteDeleteSchema)
    if ('response' in validation) return validation.response
    const { noteId } = validation.data

    await prisma.note.deleteMany({
      where: { id: noteId, userId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
