import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherTrigger } from '@/lib/pusher'
import { sendCallNotification } from '@/lib/push-notifications'
import { callCreateSchema, validateBody } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateBody(req, callCreateSchema)
    if ('response' in validation) return validation.response
    const { channelName, receiverId } = validation.data

    // Generate unique room ID (numeric 1-10000 for URL, stored as string)
    const agoraUid = Math.floor(Math.random() * 10000);
    const roomId = `room_${agoraUid}`; // clearly string
    
    // Create room
    const room = await prisma.room.create({
      data: {
        roomId,
        callerId: session.user.id,
        channelName: channelName || roomId,
        status: 'waiting',
        receiverId: receiverId || null,
      },
      include: {
        caller: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Notify all online users about the call via Pusher
    await pusherTrigger('calls', 'incoming-call', {
      roomId: room.roomId,
      callerId: room.callerId,
      callerName: room.caller.name || 'Unknown',
      channelName: room.channelName,
      createdAt: room.createdAt,
    })

    // Send push notification to specific receiver if provided
    if (receiverId && receiverId !== session.user.id) {
      const pushResult = await sendCallNotification(receiverId, {
        roomId: room.roomId,
        callerId: session.user.id,
        callerName: room.caller.name || 'Unknown',
        channelName: room.channelName,
      })
      
      console.log('📱 Push notification sent:', pushResult)
    }

    // Also send push to all users who have enabled notifications (broadcast for random matching)
    if (!receiverId) {
      // Get all users except caller who have push subscriptions
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: { not: session.user.id } },
        select: { userId: true },
        distinct: ['userId'],
      })

      // Send to all subscribed users (for random matching)
      const pushPromises = subscriptions.map((sub) =>
        sendCallNotification(sub.userId, {
          roomId: room.roomId,
          callerId: session.user.id,
          callerName: room.caller.name || 'Unknown',
          channelName: room.channelName,
        })
      )

      const pushResults = await Promise.allSettled(pushPromises)
      const successful = pushResults.filter((r) => r.status === 'fulfilled' && (r.value as any).success).length
      
      console.log(`📱 Broadcast push sent to ${successful} users`)
    }

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        roomId: room.roomId,
        channelName: room.channelName,
        callerId: room.callerId,
      }
    })
  } catch (error) {
    console.error('Error creating call:', error)
    return NextResponse.json({ error: 'Failed to create call' }, { status: 500 })
  }
}
