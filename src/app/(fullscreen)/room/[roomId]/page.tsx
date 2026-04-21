'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { PhoneOff, Loader2, Phone } from 'lucide-react'
import { AgoraVideoCall } from '@/components/lisan/agora-video-call'
import { useAppStore } from '@/lib/store'
import { pusherClient } from '@/lib/pusher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/lisan/language-provider'

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    }>
      <RoomContent />
    </Suspense>
  )
}

function RoomContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { setCallTimer } = useAppStore()
  const { t, textClass } = useLanguage()

  const roomId = params.roomId as string
  const autoJoin = searchParams.get('join') === 'true'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [hasJoined, setHasJoined] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [agoraToken, setAgoraToken] = useState('')
  const [callEnded, setCallEnded] = useState(false)
  const joiningInProgress = useRef(false)

  useEffect(() => {
    sessionStorage.setItem('currentRoomId', roomId)
    return () => {
      sessionStorage.removeItem('currentRoomId')
    }
  }, [roomId])

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

        if (data.room.isCaller || data.room.isReceiver) {
          setHasJoined(true)
          fetchAgoraToken(data.room.channelName)
          return
        }

        if (autoJoin && data.room.status === 'waiting') {
          handleJoin()
        }
      } catch {
        setError('Failed to load room')
        setLoading(false)
      }
    }

    fetchRoom()
  }, [roomId, session?.user?.id, autoJoin])

  useEffect(() => {
    if (!roomId) return

    const channel = pusherClient.subscribe(`room-${roomId}`)

    channel.bind('receiver-joined', (data: any) => {
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

  const fetchAgoraToken = async (channelName: string) => {
    try {
      const res = await fetch('/api/agora-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channelName,
          role: 'publisher',
        }),
      })
      const data = await res.json()
      setAgoraToken(data.token || '')
    } catch {
      setAgoraToken('')
    }
  }

  const handleJoin = async () => {
    if (isJoining || hasJoined || joiningInProgress.current) return

    joiningInProgress.current = true
    setIsJoining(true)
    try {
      const res = await fetch('/api/calls/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to join')
        setIsJoining(false)
        joiningInProgress.current = false
        return
      }

      setRoom(data.room)
      setHasJoined(true)
      setIsJoining(false)
      joiningInProgress.current = false
      setCallTimer(240)
      fetchAgoraToken(data.room.channelName)
    } catch {
      setError('Failed to join call')
      setIsJoining(false)
      joiningInProgress.current = false
    }
  }

  const handleEndCall = async () => {
    try {
      await fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })
      router.push('/')
    } catch {}
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4">
        <p className={cn('text-lg mb-4', textClass)}>{error}</p>
        <Button onClick={() => router.push('/')} variant="secondary">
          {t('calls.goHome')}
        </Button>
      </div>
    )
  }

  if (callEnded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
        <p className={cn('text-xl', textClass)}>{t('calls.callEnded')}</p>
        <p className={cn('text-sm text-gray-400 mt-2', textClass)}>{t('calls.redirecting')}</p>
      </div>
    )
  }

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

          <p className={cn('text-xl font-medium mb-2', textClass)}>{t('calls.incomingCall')}</p>
          <p className={cn('text-2xl font-bold mb-8', textClass)}>
            {room.caller?.name || 'Unknown'}
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
              <span className={cn('text-sm', textClass)}>{t('calls.decline')}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: isJoining ? 1 : 0.95 }}
              onClick={handleJoin}
              disabled={isJoining}
              className={`flex flex-col items-center gap-2 ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isJoining ? 'bg-gray-500' : 'bg-green-500'}`}>
                {isJoining ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Phone className="w-8 h-8" />
                )}
              </div>
              <span className={cn('text-sm', textClass)}>{isJoining ? t('calls.joining') : t('calls.join')}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      {process.env.NEXT_PUBLIC_AGORA_APP_ID && room?.channelName && agoraToken ? (
        <AgoraVideoCall
          appId={process.env.NEXT_PUBLIC_AGORA_APP_ID}
          channel={room.channelName}
          token={agoraToken}
          uid={null}
          onLeave={handleEndCall}
          callTimer={240}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <p className={cn('text-xl mb-4', textClass)}>{t('calls.joinCall')}</p>
          <p className={cn('text-gray-400 mb-6', textClass)}>{t('calls.connectingTo')} {room?.caller?.name}...</p>
          <Button variant="destructive" onClick={handleEndCall}>
            <PhoneOff className="w-5 h-5 mr-2" />
            {t('calls.endCall')}
          </Button>
        </div>
      )}
    </div>
  )
}
