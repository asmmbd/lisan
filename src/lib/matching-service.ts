import { PrismaClient } from '@prisma/client'
import Pusher from 'pusher'

const prisma = new PrismaClient()

// Pusher server-side instance
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export interface MatchRequest {
  userId: string
  socketId: string
  userName?: string
  joinedAt: Date
}

export interface ActiveMatch {
  matchId: string
  user1Id: string
  user2Id: string
  channelName: string
  roomName: string
  status: 'waiting' | 'connected' | 'ended'
  createdAt: Date
}

// Add user to matching queue
export async function addToQueue(user: MatchRequest) {
  // Remove if already in queue
  await prisma.matchingQueue.deleteMany({
    where: { userId: user.userId }
  })

  // Add to queue
  await prisma.matchingQueue.create({
    data: {
      userId: user.userId,
      socketId: user.socketId,
      userName: user.userName || 'Guest',
      status: 'waiting',
    }
  })

  console.log(`✅ User ${user.userId} added to queue`)
}

// Remove user from queue
export async function removeFromQueue(userId: string) {
  await prisma.matchingQueue.deleteMany({
    where: { userId }
  })
  console.log(`👋 User ${userId} removed from queue`)
}

// Try to match users
export async function tryMatch(userId: string): Promise<ActiveMatch | null> {
  // Find another waiting user (not the current user)
  const waitingUser = await prisma.matchingQueue.findFirst({
    where: {
      userId: { not: userId },
      status: 'waiting'
    },
    orderBy: { joinedAt: 'asc' }
  })

  if (!waitingUser) {
    console.log(`⏳ No partner available for ${userId}`)
    return null
  }

  // Get current user
  const currentUser = await prisma.matchingQueue.findUnique({
    where: { userId }
  })

  if (!currentUser) return null

  // Generate unique channel and room names
  const channelName = `lisan-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`
  const roomName = `room-${Date.now()}`
  const matchId = `match-${Date.now()}`

  // Create match record
  const match = await prisma.activeMatch.create({
    data: {
      matchId,
      user1Id: currentUser.userId,
      user2Id: waitingUser.userId,
      channelName,
      roomName,
      status: 'waiting',
    }
  })

  // Create Room for the match (so room page works)
  await prisma.room.create({
    data: {
      roomId: matchId,
      callerId: currentUser.userId,
      receiverId: waitingUser.userId,
      channelName,
      status: 'active',
    }
  })

  // Update both users status
  await prisma.matchingQueue.updateMany({
    where: {
      userId: { in: [currentUser.userId, waitingUser.userId] }
    },
    data: { status: 'matched' }
  })

  // Notify both users via Pusher (with room info for navigation)
  await pusher.trigger(`private-user-${currentUser.userId}`, 'match-found', {
    matchId,
    roomId: matchId,
    partnerId: waitingUser.userId,
    partnerName: waitingUser.userName,
    channelName,
    roomName,
    message: 'পার্টনার পাওয়া গেছে!'
  })

  await pusher.trigger(`private-user-${waitingUser.userId}`, 'match-found', {
    matchId,
    roomId: matchId,
    partnerId: currentUser.userId,
    partnerName: currentUser.userName,
    channelName,
    roomName,
    message: 'পার্টনার পাওয়া গেছে!'
  })

  console.log(`🎉 MATCHED: ${currentUser.userId} <-> ${waitingUser.userId}`)

  return {
    matchId: match.matchId,
    user1Id: match.user1Id,
    user2Id: match.user2Id,
    channelName: match.channelName,
    roomName: match.roomName,
    status: match.status as 'waiting' | 'connected' | 'ended',
    createdAt: match.createdAt,
  }
}

// End match
export async function endMatch(matchId: string, endedBy: string) {
  const match = await prisma.activeMatch.findUnique({
    where: { matchId }
  })

  if (!match) return

  // Update match status
  await prisma.activeMatch.update({
    where: { matchId },
    data: { status: 'ended', endedAt: new Date(), endedBy }
  })

  // Remove users from queue
  await prisma.matchingQueue.deleteMany({
    where: {
      userId: { in: [match.user1Id, match.user2Id] }
    }
  })

  // Notify both users
  const partnerId = match.user1Id === endedBy ? match.user2Id : match.user1Id
  
  await pusher.trigger(`private-user-${endedBy}`, 'call-ended', {
    message: 'কল শেষ হয়েছে'
  })
  
  await pusher.trigger(`private-user-${partnerId}`, 'partner-left', {
    message: 'পার্টনার কল শেষ করেছে'
  })

  console.log(`📞 Call ended: ${matchId}`)
}

// Get queue status
export async function getQueueStatus() {
  const waiting = await prisma.matchingQueue.count({
    where: { status: 'waiting' }
  })
  
  const active = await prisma.activeMatch.count({
    where: { status: 'connected' }
  })

  return { waiting, activeMatches: active }
}

// Handle user disconnect
export async function handleDisconnect(userId: string) {
  // Remove from queue
  await removeFromQueue(userId)

  // Check if in active match
  const activeMatch = await prisma.activeMatch.findFirst({
    where: {
      OR: [
        { user1Id: userId, status: { not: 'ended' } },
        { user2Id: userId, status: { not: 'ended' } }
      ]
    }
  })

  if (activeMatch) {
    const partnerId = activeMatch.user1Id === userId ? activeMatch.user2Id : activeMatch.user1Id
    
    await prisma.activeMatch.update({
      where: { matchId: activeMatch.matchId },
      data: { status: 'ended', endedAt: new Date() }
    })

    await pusher.trigger(`private-user-${partnerId}`, 'partner-disconnected', {
      message: 'পার্টনার সংযোগ বিচ্ছিন্ন হয়েছে'
    })
  }
}

export { pusher }
