'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, User } from 'lucide-react'
import { pusherClient } from '@/lib/pusher'
import { useRouter } from 'next/navigation'
import { useLanguage } from './language-provider'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface IncomingCall {
  roomId: string
  callerId: string
  callerName: string
  channelName: string
  createdAt: string
}

export function CallNotification() {
  const router = useRouter()
  const { t, textClass } = useLanguage()
  const { data: session } = useSession()
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const channel = pusherClient.subscribe('calls')

    channel.bind('incoming-call', (data: IncomingCall) => {
      const currentRoomId = sessionStorage.getItem('currentRoomId')
      if (currentRoomId === data.roomId) {
        return
      }

      // Don't show notification if current user is the caller
      if (session?.user?.id === data.callerId) {
        return
      }

      setIncomingCall(data)

      setTimeout(() => {
        setIncomingCall((prev) => prev?.roomId === data.roomId ? null : prev)
      }, 30000)
    })

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe('calls')
    }
  }, [session?.user?.id])

  const handleJoin = () => {
    if (incomingCall) {
      // Show connecting screen first
      setIsConnecting(true)
      
      // Notify caller that receiver joined
      fetch('/api/calls/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: incomingCall.roomId }),
      })
      
      // Wait 2 seconds then navigate to room (same as caller)
      setTimeout(() => {
        sessionStorage.setItem('currentRoomId', incomingCall.roomId)
        router.push(`/room/${incomingCall.roomId}?join=true`)
        setIncomingCall(null)
        setIsConnecting(false)
      }, 2000)
    }
  }

  return (
    <AnimatePresence>
      {incomingCall && !isConnecting && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 md:left-1/2 md:right-1/2 md:w-auto z-50 bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 shadow-2xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-white animate-pulse" />
            </div>

            <div className="flex-1">
              <p className="text-white font-semibold">{t('calls.someoneCalling')}</p>
              <p className="text-green-100 text-sm">{t('calls.incoming')}</p>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIncomingCall(null)}
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

      {/* Connecting Screen for Receiver */}
      {isConnecting && incomingCall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
        >
          {/* Two Avatars Side by Side */}
          <div className="flex items-center justify-center gap-8 mb-8">
            {/* Partner Avatar (Caller) */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <span className={cn('text-sm font-medium mt-2 text-foreground', textClass)}>
                {incomingCall.callerName}
              </span>
            </div>

            {/* Current User Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                <User className="w-10 h-10 text-primary/60" />
              </div>
              <span className={cn('text-sm font-medium mt-2 text-foreground', textClass)}>
                {t('practice.you')}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-64 mb-6">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#1CB0F6] to-[#1899D6]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />
            </div>
          </div>

          {/* Connecting Text */}
          <h2 className={cn('text-xl font-semibold mb-2 text-center text-foreground', textClass)}>
            {t('practice.connecting')}...
          </h2>
          
          {/* Warning Text */}
          <p className={cn('text-sm text-muted-foreground text-center', textClass)}>
            {t('practice.doNotSwitch')}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
