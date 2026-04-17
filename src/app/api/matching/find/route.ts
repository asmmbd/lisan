import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import Pusher from 'pusher'

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
    const { userId, userName = 'Guest' } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Remove user from queue if already exists
    await prisma.matchingQueue.deleteMany({
      where: { userId }
    })

    // Find waiting partner
    const partner = await prisma.matchingQueue.findFirst({
      where: {
        userId: { not: userId },
        status: 'waiting'
      },
      orderBy: { joinedAt: 'asc' }
    })

    if (partner) {
      // Match found!
      const channelName = `lisan-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
      const matchId = `match-${Date.now()}`

      // Create match record
      const match = await prisma.activeMatch.create({
        data: {
          matchId,
          user1Id: userId,
          user2Id: partner.userId,
          channelName,
          roomName: matchId,
          status: 'waiting',
        }
      })

      // Update both users in queue
      await prisma.matchingQueue.updateMany({
        where: { userId: { in: [userId, partner.userId] } },
        data: { status: 'matched' }
      })

      // Notify partner via Pusher
      await pusher.trigger(`user-${partner.userId}`, 'match-found', {
        matchId,
        partnerId: userId,
        partnerName: userName,
        channelName,
        roomName: matchId,
        message: 'পার্টনার পাওয়া গেছে!'
      })

      console.log(`🎉 MATCHED: ${userId} <-> ${partner.userId}`)

      return NextResponse.json({
        success: true,
        matched: true,
        matchId,
        partnerId: partner.userId,
        partnerName: partner.userName,
        channelName,
        roomName: matchId,
        message: 'পার্টনার পাওয়া গেছে!'
      })
    }

    // No partner found, add to queue
    await prisma.matchingQueue.create({
      data: {
        userId,
        socketId: userId, // Using userId as socketId for now
        userName,
        status: 'waiting',
      }
    })

    // Count waiting users
    const waitingCount = await prisma.matchingQueue.count({
      where: { status: 'waiting' }
    })

    console.log(`⏳ User ${userId} waiting. Queue: ${waitingCount}`)

    return NextResponse.json({
      success: true,
      matched: false,
      waiting: true,
      queuePosition: waitingCount,
      message: 'পার্টনারের জন্য অপেক্ষা করা হচ্ছে...'
    })

  } catch (error) {
    console.error('Find partner error:', error)
    return NextResponse.json(
      { error: 'Failed to find partner' },
      { status: 500 }
    )
  }
}
