import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const room = await prisma.room.findUnique({
      where: { roomId },
      include: {
        caller: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Check if user is allowed to access this room
    const isCaller = room.callerId === session.user.id
    const isReceiver = room.receiverId === session.user.id
    
    if (!isCaller && !isReceiver && room.status === 'waiting') {
      // Allow non-participants to see waiting rooms (they can join)
      return NextResponse.json({
        room: {
          roomId: room.roomId,
          channelName: room.channelName,
          status: room.status,
          caller: room.caller,
          isWaiting: true,
        }
      })
    }

    if (!isCaller && !isReceiver && room.status !== 'waiting') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      room: {
        id: room.id,
        roomId: room.roomId,
        channelName: room.channelName,
        status: room.status,
        caller: room.caller,
        receiver: room.receiver,
        isCaller,
        isReceiver,
      }
    })
  } catch (error) {
    console.error('Error getting room:', error)
    return NextResponse.json({ error: 'Failed to get room' }, { status: 500 })
  }
}
