'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import io from 'socket.io-client'

interface UseSocketReturn {
  socket: any | null
  isConnected: boolean
  onlineUsers: string[]
  currentUserId: string
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [socket, setSocket] = useState<any | null>(null)
  const socketRef = useRef<any | null>(null)

  useEffect(() => {
    // Generate a random user ID for this session
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`
    setTimeout(() => setCurrentUserId(userId), 0)

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      query: { userId },
    })

    socketRef.current = socket
    setTimeout(() => setSocket(socket), 0)

    socket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to signaling server')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from signaling server')
    })

    socket.on('online-users', (users: string[]) => {
      setOnlineUsers(users.filter(id => id !== userId))
    })

    return () => {
      socket.disconnect()
      setSocket(null)
    }
  }, [])

  return {
    socket,
    isConnected,
    onlineUsers,
    currentUserId,
  }
}

export default useSocket
