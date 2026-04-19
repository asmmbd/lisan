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

    const { roomId } = await req.json()
    
    // Find room
    const room = await prisma.room.findUnique({
      where: { roomId },
      include: {
        caller: { select: { id: true, name: true } },
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is the caller
    if (room.callerId === session.user.id) {
      return NextResponse.json({ error: 'Cannot join your own call' }, { status: 400 })
    }

    // Check if room already has a receiver
    if (room.receiverId) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 })
    }

    // Check if room is still waiting
    if (room.status !== 'waiting') {
      return NextResponse.json({ error: 'Call has ended' }, { status: 400 })
    }

    // Update room with receiver
    const updatedRoom = await prisma.room.update({
      where: { roomId },
      data: {
        receiverId: session.user.id,
        status: 'active',
      },
      include: {
        caller: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      }
    })

    // Notify caller that someone joined
    await pusherTrigger(`room-${roomId}`, 'receiver-joined', {
      receiverId: session.user.id,
      receiverName: updatedRoom.receiver?.name || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      room: updatedRoom,
    })
  } catch (error) {
    console.error('Error joining call:', error)
    return NextResponse.json({ error: 'Failed to join call' }, { status: 500 })
  }
}
