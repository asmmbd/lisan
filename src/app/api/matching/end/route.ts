import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Pusher from 'pusher'
import { matchEndSchema, validateBody } from '@/lib/validation'

const prisma = new PrismaClient()

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, matchEndSchema)
    if ('response' in validation) return validation.response
    const { matchId, userId } = validation.data

    // Get match details
    const match = await prisma.activeMatch.findUnique({
      where: { matchId }
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Update match status
    await prisma.activeMatch.update({
      where: { matchId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        endedBy: userId
      }
    })

    // Remove users from queue
    await prisma.matchingQueue.deleteMany({
      where: {
        userId: { in: [match.user1Id, match.user2Id] }
      }
    })

    // Notify partner
    const partnerId = match.user1Id === userId ? match.user2Id : match.user1Id
    await pusher.trigger(`user-${partnerId}`, 'partner-left', {
      message: 'পার্টনার কল শেষ করেছে'
    })

    console.log(`📞 Call ended: ${matchId} by ${userId}`)

    return NextResponse.json({ success: true, message: 'Call ended' })

  } catch (error) {
    console.error('End call error:', error)
    return NextResponse.json(
      { error: 'Failed to end call' },
      { status: 500 }
    )
  }
}
