'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

interface MatchData {
  partnerId: string
  channel: string
  roomName: string
  message: string
}

interface UseMatchingReturn {
  isConnected: boolean
  isWaiting: boolean
  isMatched: boolean
  matchData: MatchData | null
  queuePosition: number
  waitingMessage: string
  error: string | null
  findPartner: () => void
  cancelMatching: () => void
  endCall: () => void
  partnerLeft: boolean
  partnerDisconnected: boolean
}

export function useMatching(): UseMatchingReturn {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isMatched, setIsMatched] = useState(false)
  const [matchData, setMatchData] = useState<MatchData | null>(null)
  const [queuePosition, setQueuePosition] = useState(0)
  const [waitingMessage, setWaitingMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [partnerLeft, setPartnerLeft] = useState(false)
  const [partnerDisconnected, setPartnerDisconnected] = useState(false)

  // Generate unique user ID
  const userId = useRef(`user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`)

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    
    console.log('🔌 Connecting to matching server:', socketUrl)
    
    const socket = io(socketUrl, {
      query: { userId: userId.current },
      transports: ['websocket', 'polling'],
    })
    
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('✅ Connected to matching server')
      setIsConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from matching server')
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err)
      setError('সার্ভারে সংযোগ করতে ব্যর্থ')
    })

    // Waiting for partner
    socket.on('waiting-for-partner', (data) => {
      console.log('⏳ Waiting for partner:', data)
      setIsWaiting(true)
      setQueuePosition(data.queuePosition)
      setWaitingMessage(data.message)
    })

    // Match found!
    socket.on('match-found', (data: MatchData) => {
      console.log('🎉 Match found:', data)
      setIsWaiting(false)
      setIsMatched(true)
      setMatchData(data)
    })

    // Partner left
    socket.on('partner-left', (data) => {
      console.log('👋 Partner left:', data)
      setPartnerLeft(true)
      setIsMatched(false)
    })

    // Partner disconnected
    socket.on('partner-disconnected', (data) => {
      console.log('⚠️ Partner disconnected:', data)
      setPartnerDisconnected(true)
      setIsMatched(false)
    })

    // Matching cancelled
    socket.on('matching-cancelled', () => {
      console.log('Matching cancelled')
      setIsWaiting(false)
      setQueuePosition(0)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const findPartner = useCallback(() => {
    setPartnerLeft(false)
    setPartnerDisconnected(false)
    setIsMatched(false)
    setMatchData(null)
    setError(null)
    
    console.log('🔍 Finding partner...')
    socketRef.current?.emit('find-partner')
  }, [])

  const cancelMatching = useCallback(() => {
    console.log('❌ Cancelling matching...')
    socketRef.current?.emit('cancel-matching')
    setIsWaiting(false)
    setQueuePosition(0)
  }, [])

  const endCall = useCallback(() => {
    console.log('📞 Ending call...')
    socketRef.current?.emit('end-call')
    setIsMatched(false)
    setMatchData(null)
  }, [])

  return {
    isConnected,
    isWaiting,
    isMatched,
    matchData,
    queuePosition,
    waitingMessage,
    error,
    findPartner,
    cancelMatching,
    endCall,
    partnerLeft,
    partnerDisconnected,
  }
}

export default useMatching
