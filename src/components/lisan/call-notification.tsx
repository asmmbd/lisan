'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff } from 'lucide-react'
import { pusherClient } from '@/lib/pusher'
import { useRouter } from 'next/navigation'

interface IncomingCall {
  roomId: string
  callerId: string
  callerName: string
  channelName: string
  createdAt: string
}

export function CallNotification() {
  const router = useRouter()
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)

  useEffect(() => {
    // Subscribe to calls channel
    const channel = pusherClient.subscribe('calls')

    channel.bind('incoming-call', (data: IncomingCall) => {
      console.log('Incoming call received in Notification:', data)
      
      // Don't show notification if user already in this room
      const currentRoomId = sessionStorage.getItem('currentRoomId')
      if (currentRoomId === data.roomId) {
        console.log('Already in room, skipping notification')
        return
      }
      
      setIncomingCall(data)
      
      // Auto-dismiss after 30 seconds
      setTimeout(() => {
        setIncomingCall((prev) => {
          if (prev?.roomId === data.roomId) {
            console.log('Incoming call auto-dismissed')
            return null
          }
          return prev
        })
      }, 30000)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe('calls')
    }
  }, [])

  const handleJoin = () => {
    if (incomingCall) {
      console.log('Accepting call, navigating to room with join flag...')
      // Set current room before navigating
      sessionStorage.setItem('currentRoomId', incomingCall.roomId)
      router.push(`/room/${incomingCall.roomId}?join=true`)
      setIncomingCall(null)
    }
  }

  const handleDecline = () => {
    setIncomingCall(null)
  }

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-white animate-pulse" />
            </div>
            
            <div className="flex-1">
              <p className="text-white font-semibold">{incomingCall.callerName}</p>
              <p className="text-green-100 text-sm">is calling you...</p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDecline}
                className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg"
              >
                <PhoneOff className="w-5 h-5 text-white" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleJoin}
                className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
              >
                <Phone className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
