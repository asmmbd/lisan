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

    // 1. Cleanup stale entries (older than 3 minutes)
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000)
    await prisma.matchingQueue.deleteMany({
      where: {
        OR: [
          { updatedAt: { lt: threeMinutesAgo } },
          { userId: userId } // Always cleanup self before starting fresh
        ]
      }
    })

    // 2. Atomic Matching Logic
    const result = await prisma.$transaction(async (tx) => {
      // Find oldest waiting partner
      const partner = await tx.matchingQueue.findFirst({
        where: {
          userId: { not: userId },
          status: 'waiting'
        },
        orderBy: { joinedAt: 'asc' }
      })

      if (partner) {
        // Double check partner is still waiting (atomic check via update)
        const updatedPartner = await tx.matchingQueue.updateMany({
          where: {
            id: partner.id,
            status: 'waiting'
          },
          data: { status: 'matched' }
        })

        if (updatedPartner.count > 0) {
          // Successfully claimed the partner!
          const channelName = `lisan-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
          const matchId = `match-${Date.now()}`

          // Create match record
          await tx.activeMatch.create({
            data: {
              matchId,
              user1Id: userId,
              user2Id: partner.userId,
              channelName,
              roomName: matchId,
              status: 'waiting',
            }
          })

          return { matched: true, partner, channelName, matchId }
        }
      }

      // No partner or partner already claimed, join queue
      const entry = await tx.matchingQueue.create({
        data: {
          userId,
          socketId: userId,
          userName,
          status: 'waiting',
        }
      })

      // Count waiting users BEFORE this user
      const waitingCount = await tx.matchingQueue.count({
        where: { status: 'waiting' }
      })

      return { matched: false, queuePosition: waitingCount }
    })

    if (result.matched && result.partner) {
      // Notify partner via Pusher (Using obfuscated channel name)
      const obfuscatedId = Buffer.from(result.partner.userId).toString('base64').replace(/=/g, '').slice(0, 12)
      const partnerChannel = `u-${obfuscatedId}`
      
      await pusher.trigger(partnerChannel, 'match-found', {
        matchId: result.matchId,
        partnerId: userId,
        partnerName: userName,
        channelName: result.channelName,
        roomName: result.matchId,
        message: 'পার্টনার পাওয়া গেছে!'
      })

      console.log(`🎉 MATCHED: ${userId} <-> ${result.partner.userId}`)

      return NextResponse.json({
        success: true,
        matched: true,
        matchId: result.matchId,
        partnerId: result.partner.userId,
        partnerName: result.partner.userName,
        channelName: result.channelName,
        roomName: result.matchId,
        message: 'পার্টনার পাওয়া গেছে!'
      })
    }

    console.log(`⏳ User ${userId} waiting. Queue: ${result.queuePosition}`)

    return NextResponse.json({
      success: true,
      matched: false,
      waiting: true,
      queuePosition: result.queuePosition,
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
