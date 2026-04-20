import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherTrigger } from '@/lib/pusher'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelName } = await req.json()
    
    // Generate unique room ID (numeric 1-10000 for URL)
    const roomId = Math.floor(Math.random() * 10000) + 1
    
    // Create room
    const room = await prisma.room.create({
      data: {
        roomId,
        callerId: session.user.id,
        channelName: channelName || `room_${roomId}`,
        status: 'waiting',
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
