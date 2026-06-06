import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { matchCancelSchema, validateBody } from '@/lib/validation'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, matchCancelSchema)
    if ('response' in validation) return validation.response
    const { userId } = validation.data

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
