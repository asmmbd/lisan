'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff } from 'lucide-react'
import { pusherClient } from '@/lib/pusher'
import { useRouter } from 'next/navigation'
import { useLanguage } from './language-provider'
import { useSession } from 'next-auth/react'

interface IncomingCall {
  roomId: string
  callerId: string
  callerName: string
  channelName: string
  createdAt: string
}

export function CallNotification() {
  const router = useRouter()
  const { t } = useLanguage()
  const { data: session } = useSession()
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)

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
      sessionStorage.setItem('currentRoomId', incomingCall.roomId)
      router.push(`/room/${incomingCall.roomId}?join=true`)
      setIncomingCall(null)
    }
  }

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-4 shadow-2xl"
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
    </AnimatePresence>
  )
}
