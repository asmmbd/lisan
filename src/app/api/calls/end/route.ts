import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = await req.json()
    
    const room = await prisma.room.findUnique({
      where: { roomId }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Only caller or receiver can end
    if (room.callerId !== session.user.id && room.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update room status
    await prisma.room.update({
      where: { roomId },
      data: {
        status: 'ended',
        endedAt: new Date(),
      }
    })

    // Notify other participant
    await pusherServer.trigger(`room-${roomId}`, 'call-ended', {
      endedBy: session.user.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error ending call:', error)
    return NextResponse.json({ error: 'Failed to end call' }, { status: 500 })
  }
}
