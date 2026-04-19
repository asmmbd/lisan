'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PhoneOff, Loader2, Phone } from 'lucide-react'
import { AgoraVideoCall } from '@/components/lisan/agora-video-call'
import { useAppStore } from '@/lib/store'
import { pusherClient } from '@/lib/pusher'
import { Button } from '@/components/ui/button'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { setCallTimer } = useAppStore()
  
  const roomId = params.roomId as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [agoraToken, setAgoraToken] = useState('')
  const [callEnded, setCallEnded] = useState(false)

  // Fetch room info
  useEffect(() => {
    if (!roomId || !session?.user?.id) return

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/calls/room/${roomId}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load room')
          setLoading(false)
          return
        }

        setRoom(data.room)
        setLoading(false)

        // Auto-join if already participant
        if (data.room.isCaller || data.room.isReceiver) {
          setHasJoined(true)
          fetchAgoraToken(data.room.channelName)
        }
      } catch (err) {
        setError('Failed to load room')
        setLoading(false)
      }
    }

    fetchRoom()
  }, [roomId, session?.user?.id])

  // Subscribe to Pusher events
  useEffect(() => {
    if (!roomId) return

    const channel = pusherClient.subscribe(`room-${roomId}`)

    channel.bind('receiver-joined', (data: any) => {
      console.log('Receiver joined:', data)
      setRoom((prev: any) => ({
        ...prev,
        receiverId: data.receiverId,
        receiverName: data.receiverName,
        status: 'active',
      }))
    })

    channel.bind('call-ended', () => {
      setCallEnded(true)
      setTimeout(() => router.push('/'), 2000)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`room-${roomId}`)
    }
  }, [roomId, router])

  // Fetch Agora token
  const fetchAgoraToken = async (channelName: string) => {
    try {
      const res = await fetch('/api/agora-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          uid: session?.user?.id,
          role: 'publisher',
        }),
      })
      const data = await res.json()
      setAgoraToken(data.token || '')
    } catch (err) {
      console.error('Failed to get token:', err)
    }
  }

  // Join call
  const handleJoin = async () => {
    try {
      const res = await fetch('/api/calls/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to join')
        return
      }

      const data = await res.json()
      setRoom(data.room)
      setHasJoined(true)
      setCallTimer(240)
      fetchAgoraToken(data.room.channelName)
    } catch (err) {
      setError('Failed to join call')
    }
  }

  // End call
  const handleEndCall = async () => {
    try {
      await fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })
      router.push('/')
    } catch (err) {
      console.error('Error ending call:', err)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-lg mb-4">{error}</p>
        <Button onClick={() => router.push('/')} variant="secondary">
          Go Home
        </Button>
      </div>
    )
  }

  // Call ended
  if (callEnded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <p className="text-xl">Call Ended</p>
        <p className="text-sm text-gray-400 mt-2">Redirecting...</p>
      </div>
    )
  }

  // Waiting room - show Join/Cancel buttons
  if (!hasJoined && room?.isWaiting) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-green-900 to-black text-white p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
            <Phone className="w-12 h-12 text-green-400 animate-pulse" />
          </div>
          
          <p className="text-xl font-medium mb-2">Incoming Call</p>
          <p className="text-2xl font-bold mb-8">
            {room.caller?.name || 'Unknown'} is calling...
          </p>

          <div className="flex gap-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                <PhoneOff className="w-8 h-8" />
              </div>
              <span className="text-sm">Decline</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleJoin}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                <Phone className="w-8 h-8" />
              </div>
              <span className="text-sm">Join</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Active call - full screen video
  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      {/* Agora Video Call */}
      {process.env.NEXT_PUBLIC_AGORA_APP_ID && room?.channelName ? (
        <AgoraVideoCall
          appId={process.env.NEXT_PUBLIC_AGORA_APP_ID}
          channel={room.channelName}
          token={agoraToken}
          uid={session?.user?.id || 'guest'}
          onLeave={handleEndCall}
          callTimer={240}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <p className="text-xl mb-4">Video Call Setup</p>
          <p className="text-gray-400 mb-6">Connecting to {room?.caller?.name}...</p>
          <Button variant="destructive" onClick={handleEndCall}>
            <PhoneOff className="w-5 h-5 mr-2" />
            End Call
          </Button>
        </div>
      )}
    </div>
  )
}
