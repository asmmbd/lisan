'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import Pusher from 'pusher-js'

interface MatchData {
  matchId: string
  partnerId: string
  partnerName: string
  channelName: string
  roomName: string
  message: string
}

interface UsePusherMatchingReturn {
  isConnected: boolean
  isWaiting: boolean
  isMatched: boolean
  matchData: MatchData | null
  queuePosition: number
  error: string | null
  findPartner: (userId: string, userName?: string) => Promise<void>
  cancelMatching: (userId: string) => Promise<void>
  endCall: (matchId: string, userId: string) => Promise<void>
  partnerLeft: boolean
}

export function usePusherMatching(): UsePusherMatchingReturn {
  const pusherRef = useRef<Pusher | null>(null)
  const channelRef = useRef<any>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isMatched, setIsMatched] = useState(false)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [queuePosition, setQueuePosition] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [partnerLeft, setPartnerLeft] = useState(false)

  // Initialize Pusher
  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherKey || !pusherCluster) {
      setError('Pusher configuration missing')
      return
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    })

    pusherRef.current = pusher

    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected')
      setIsConnected(true)
    })

    pusher.connection.bind('disconnected', () => {
      console.log('❌ Pusher disconnected')
      setIsConnected(false)
    })

    return () => {
      pusher.disconnect()
    }
  }, [])

  const findPartner = useCallback(async (userId: string, userName: string = 'Guest') => {
    try {
      setError(null)
      setPartnerLeft(false)

      // Subscribe to user-specific channel
      const channelName = `user-${userId}`
      const channel = pusherRef.current?.subscribe(channelName)
      channelRef.current = channel

      if (channel) {
        channel.bind('match-found', (data: MatchData) => {
          console.log('🎉 Match found:', data)
          setIsWaiting(false)
          setIsMatched(true)
          setMatchData(data)
        })

        channel.bind('partner-left', () => {
          console.log('👋 Partner left')
          setPartnerLeft(true)
          setIsMatched(false)
        })

        channel.bind('partner-disconnected', () => {
          console.log('⚠️ Partner disconnected')
          setPartnerLeft(true)
          setIsMatched(false)
        })
      }

      // Call API to find/join queue
      const response = await fetch('/api/matching/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find partner')
      }

      if (data.matched) {
        // Immediately matched
        setIsWaiting(false)
        setIsMatched(true)
        setMatchData(data)
      } else {
        // Added to queue
        setIsWaiting(true)
        setQueuePosition(data.queuePosition || 1)
      }

    } catch (err: any) {
      console.error('Find partner error:', err)
      setError(err.message)
    }
  }, [])

  const cancelMatching = useCallback(async (userId: string) => {
    try {
      await fetch('/api/matching/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      // Unsubscribe from channel
      if (channelRef.current) {
        channelRef.current.unbind_all()
        pusherRef.current?.unsubscribe(`user-${userId}`)
      }

      setIsWaiting(false)
      setIsMatched(false)
      setMatchData(null)

    } catch (err) {
      console.error('Cancel matching error:', err)
    }
  }, [])

  const endCall = useCallback(async (matchId: string, userId: string) => {
    try {
      await fetch('/api/matching/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, userId }),
      })

      setIsMatched(false)
      setMatchData(null)

    } catch (err) {
      console.error('End call error:', err)
    }
  }, [])

  return {
    isConnected,
    isWaiting,
    isMatched,
    matchData,
    queuePosition,
    error,
    findPartner,
    cancelMatching,
    endCall,
    partnerLeft,
  }
}

export default usePusherMatching
