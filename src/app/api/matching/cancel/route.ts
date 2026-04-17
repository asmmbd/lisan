import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Remove from queue
    await prisma.matchingQueue.deleteMany({
      where: { userId }
    })

    console.log(`❌ User ${userId} cancelled matching`)

    return NextResponse.json({ success: true, message: 'Matching cancelled' })

  } catch (error) {
    console.error('Cancel matching error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel matching' },
      { status: 500 }
    )
  }
}
