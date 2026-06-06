import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pusherTrigger } from '@/lib/pusher'
import { callRoomActionSchema, validateBody } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateBody(req, callRoomActionSchema)
    if ('response' in validation) return validation.response
    const { roomId } = validation.data

    // Find the room
    const room = await prisma.room.findUnique({
      where: { roomId },
      include: {
        caller: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Update room status to ended
    await prisma.room.update({
      where: { roomId },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    })

    // Notify the caller that the call was declined
    const declinedBy = session?.user?.id === room.callerId ? 'caller' : 'receiver'
    const declinedByName = session?.user?.id === room.callerId 
      ? room.caller?.name 
      : room.receiver?.name || 'Unknown'

    // Notify via Pusher
    await pusherTrigger(`room-${roomId}`, 'call-declined', {
      roomId,
      declinedBy,
      declinedByName,
      message: 'কল প্রত্যাখ্যান করা হয়েছে',
    })

    // Also notify the caller's user channel
    await pusherTrigger(`user-${room.callerId}`, 'call-declined', {
      roomId,
      declinedBy,
      declinedByName,
      message: 'কল প্রত্যাখ্যান করা হয়েছে',
    })

    return NextResponse.json({
      success: true,
      message: 'Call declined',
    })
  } catch (error) {
    console.error('Error declining call:', error)
    return NextResponse.json({ error: 'Failed to decline call' }, { status: 500 })
  }
}
