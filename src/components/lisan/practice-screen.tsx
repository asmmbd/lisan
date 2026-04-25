'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Video, Users, Loader2, User, ChevronRight, Brain, Bot, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { AgoraVideoCall } from './agora-video-call'
import { AIAudioCall } from './ai-audio-call'
import { usePusherMatching } from '@/hooks/usePusherMatching'
import { pusherClient } from '@/lib/pusher'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLanguage } from './language-provider'

function PracticeSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-4xl mx-auto w-full">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="flex-1 px-4 max-w-4xl mx-auto w-full py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function PracticeScreen() {
  const {
    practiceState,
    setPracticeState,
    callTimer,
    setCallTimer,
    isLoading
  } = useAppStore()
  const { data: session } = useSession()
  const { t, textClass } = useLanguage()
  const userId = session?.user?.id || 'guest'
  const [agoraToken, setAgoraToken] = useState('')
  const [creatingCall, setCreatingCall] = useState(false)
  const [createdRoom, setCreatedRoom] = useState<any>(null)
  const [isWaitingForReceiver, setIsWaitingForReceiver] = useState(false)
  const router = useRouter()

  const {
    isConnected: isPusherConnected,
    isWaiting,
    isMatched,
    matchData,
    queuePosition,
    error: matchingError,
    findPartner,
    cancelMatching,
    endCall,
    partnerLeft,
  } = usePusherMatching()

  useEffect(() => {
    if (practiceState !== 'incall') return
    const interval = setInterval(() => {
      setCallTimer(Math.max(0, callTimer - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [practiceState, callTimer, setCallTimer])

  useEffect(() => {
    if (isMatched && matchData && practiceState === 'matching') {
      fetch('/api/agora-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: matchData.channelName,
          role: 'publisher'
        })
      })
        .then(res => res.json())
        .then(data => {
          setAgoraToken(data.token || '')
          setPracticeState('incall')
          setCallTimer(240)
        })
        .catch(() => {
          setAgoraToken('')
          setPracticeState('incall')
          setCallTimer(240)
        })
    }
  }, [isMatched, matchData, practiceState, setPracticeState, setCallTimer])

  useEffect(() => {
    if (partnerLeft) {
      setPracticeState('idle')
      setCallTimer(240)
    }
  }, [partnerLeft, setPracticeState, setCallTimer])

  const handleCreateCall = async () => {
    if (!session?.user) {
      alert(t('practice.loginToCall'))
      return
    }

    setCreatingCall(true)
    try {
      const channelName = `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      const res = await fetch('/api/calls/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName }),
      })

      const data = await res.json()

      if (data.success) {
        // Don't navigate immediately - wait for receiver
        setCreatedRoom(data.room)
        setIsWaitingForReceiver(true)
        
        // Subscribe to Pusher channel for this room
        const channel = pusherClient.subscribe(`room-${data.room.roomId}`)
        channel.bind('receiver-joined', (joinData: any) => {
          // Receiver joined - navigate to room
          router.push(`/room/${data.room.roomId}`)
        })
      }
    } finally {
      setCreatingCall(false)
    }
  }

  const handleCancelWaiting = () => {
    if (createdRoom) {
      pusherClient.unsubscribe(`room-${createdRoom.roomId}`)
    }
    setCreatedRoom(null)
    setIsWaitingForReceiver(false)
  }

  const startMatching = () => {
    setPracticeState('matching')
    findPartner(userId, session?.user?.name || t('practice.guest'))
  }

  const handleCancelMatching = () => {
    cancelMatching(userId)
    setPracticeState('idle')
  }

  const handleLeaveCall = () => {
    if (matchData) {
      endCall(matchData.matchId, userId)
    }
    setPracticeState('idle')
    setCallTimer(240)
  }

  if (isLoading) {
    return <PracticeSkeleton />
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <>
          <div className="px-4 pt-6 md:pt-10 pb-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={cn('text-xl md:text-3xl font-black', textClass)}>{t('practice.title')}</h1>
                <p className={cn('text-xs md:text-sm text-muted-foreground', textClass)}>{t('practice.subtitle')}</p>
              </div>
            </div>

            {matchingError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className={cn('text-sm text-destructive flex items-center gap-2', textClass)}>
                  <span>!</span>
                  {matchingError}
                </p>
              </div>
            )}

            <div className="mt-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPusherConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] text-muted-foreground">
                {isPusherConnected ? t('practice.liveReady') : t('practice.liveOffline')}
              </span>
            </div>
          </div>

          <div className="flex-1 px-4 max-w-4xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24 md:pb-10">
            <AnimatePresence mode="wait">
              {practiceState === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-6 py-6"
                >
                  {isWaitingForReceiver ? (
                    // Waiting for receiver UI
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl shadow-2xl p-8 min-h-[280px] flex flex-col items-center justify-center text-center"
                    >
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-10 right-10 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-10 left-10 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center shadow-xl mx-auto mb-6">
                          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                        </div>
                        <h3 className={cn('text-2xl md:text-3xl font-black text-white mb-2', textClass)}>
                          অপেক্ষা করা হচ্ছে...
                        </h3>
                        <p className={cn('text-lg text-white/80 mb-4', textClass)}>
                          কেউ কলে join করলে দুইজনকে রুমে নিয়ে যাওয়া হবে
                        </p>
                        {createdRoom && (
                          <p className="text-white/60 text-sm font-mono mb-6">
                            Room: {createdRoom.roomId}
                          </p>
                        )}
                        <Button
                          onClick={handleCancelWaiting}
                          variant="secondary"
                          className="bg-white/20 text-white hover:bg-white/30 border-0"
                        >
                          <PhoneOff className="w-4 h-4 mr-2" />
                          ক্যানসেল করুন
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                  <>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleCreateCall}
                    className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl shadow-2xl p-8 cursor-pointer min-h-[280px] flex flex-col justify-between"
                  >
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-10 right-10 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
                      <div className="absolute bottom-10 left-10 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl" />
                    </div>

                    <div className="absolute top-1/2 right-8 -translate-y-1/2">
                      <div className="relative w-24 h-24">
                        <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute inset-2 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                        <div className="relative w-24 h-24 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                          <Video className="w-12 h-12 text-emerald-600" />
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <Badge className="w-fit mb-4 bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm text-sm px-3 py-1">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2" />
                        {t('practice.liveCall')}
                      </Badge>
                      <h3 className={cn('text-3xl md:text-4xl font-black text-white mb-2', textClass)}>
                        {t('practice.heroTitle')}
                      </h3>
                      <p className={cn('text-lg text-white/80 max-w-md', textClass)}>
                        {t('practice.heroDescription')}
                      </p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-6">
                      <div className="hidden md:flex items-center gap-4">
                        <span className={cn('text-white/90 text-sm', textClass)}>
                          124 {t('practice.onlineNow')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold shadow-lg group-hover:shadow-xl transition-all">
                        <span className={cn('text-lg', textClass)}>
                          {creatingCall ? t('calls.joining') : t('practice.startCall')}
                        </span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/practice/quiz')}
                      className="group bg-card rounded-xl border border-border p-5 cursor-pointer hover:border-primary/50 transition-colors col-span-2 md:col-span-1"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className={cn('font-bold', textClass)}>{t('practice.soloPractice')}</h4>
                          <p className={cn('text-xs text-muted-foreground', textClass)}>{t('practice.soloPracticeDescription')}</p>
                        </div>
                      </div>
                    </motion.div>


                    {/* AI Audio Call */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/practice/ai-call')}
                      className="group bg-card rounded-xl border border-border p-5 cursor-pointer hover:border-[#c9a96e]/50 transition-colors col-span-2 md:col-span-1"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0a1a12] to-[#1a3a22] flex items-center justify-center">
                          <Bot className="w-6 h-6 text-[#c9a96e]" />
                        </div>
                        <div>
                          <h4 className={cn('font-bold', textClass)}>AI সাথে কথা বলুন</h4>
                          <p className={cn('text-xs text-muted-foreground', textClass)}>আরবি প্র্যাকটিস করুন</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
                )}
                </motion.div>
              )}

              {practiceState === 'matching' && !isMatched && (
                <motion.div
                  key="matching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full pb-20 px-4 mt-20"
                >
                  <div className="relative mb-6">
                    <div className="relative w-28 h-28">
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                      <div className="relative w-28 h-28 rounded-full gradient-islamic flex items-center justify-center z-10">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <motion.h2
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={cn('text-lg font-semibold mb-2', textClass)}
                  >
                    {isWaiting ? t('practice.waiting') : t('practice.searching')}
                  </motion.h2>

                  {isWaiting && (
                    <p className={cn('text-sm text-muted-foreground text-center', textClass)}>
                      {t('practice.queuePosition')}: {queuePosition}
                    </p>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleCancelMatching}
                    className={cn('mt-8 text-muted-foreground border border-border rounded-xl', textClass)}
                  >
                    {t('practice.cancel')}
                  </Button>
                </motion.div>
              )}

              {practiceState === 'matching' && isMatched && matchData && (
                <motion.div
                  key="matched"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full pb-20 px-4 mt-20"
                >
                  <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-4 shadow-lg">
                    <User className="w-12 h-12 text-white" />
                  </div>

                  <h2 className={cn('text-xl font-bold text-emerald-500 mb-2', textClass)}>
                    {t('practice.matched')}
                  </h2>
                  <p className={cn('text-sm text-muted-foreground text-center mb-8', textClass)}>
                    {matchData.partnerName} {t('practice.connectingTo')}
                  </p>

                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </motion.div>
              )}

              {practiceState === 'incall' && matchData && (
                <motion.div
                  key="incall"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col h-full bg-black rounded-xl overflow-hidden mt-4 shadow-2xl"
                >
                  {!process.env.NEXT_PUBLIC_AGORA_APP_ID || !agoraToken ? (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                      <div className="p-4 bg-white/10 rounded-xl text-center text-white">
                        <p className="font-medium mb-2">
                          {!process.env.NEXT_PUBLIC_AGORA_APP_ID ? t('practice.configError') : t('practice.connecting')}
                        </p>
                        <p className="text-xs opacity-70">
                          {agoraToken ? t('practice.startingCall') : t('practice.fetchingToken')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <AgoraVideoCall
                      appId={process.env.NEXT_PUBLIC_AGORA_APP_ID}
                      channel={matchData.channelName}
                      token={agoraToken}
                      uid={null}
                      onLeave={handleLeaveCall}
                      callTimer={callTimer}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </>
    </div>
  )
}

export default PracticeScreen
