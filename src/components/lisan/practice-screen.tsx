'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Video, Users, Loader2, User, ChevronRight, Brain, Bot, PhoneOff, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { AgoraVideoCall } from './agora-video-call'
import { AIAudioCall } from './ai-audio-call'
import { usePusherMatching } from '@/hooks/usePusherMatching'
import { pusherClient } from '@/lib/pusher'
import { cn } from '@/lib/utils'
import { useLanguage } from './language-provider'

// Earth Globe Illustration Component with rotation animation
function EarthGlobe({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={cn('w-full h-full', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ rotate: 360 }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      {/* Outer circles with pulse */}
      <motion.circle 
        cx="100" 
        cy="100" 
        r="85" 
        fill="#7DD3C0" 
        opacity="0.3"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.circle 
        cx="100" 
        cy="100" 
        r="70" 
        fill="#5CC9B0" 
        opacity="0.4"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
      />
      
      {/* Main globe */}
      <circle cx="100" cy="100" r="55" fill="#4DB6A4" />
      
      {/* Continents - stylized */}
      <path
        d="M70 75c8-5 18-3 24 2s8 12 4 18-12 10-20 8-16-12-12-20c2-4 4-8 4-8z"
        fill="#2D8B7A"
      />
      <path
        d="M115 65c6-2 12 2 14 8s-2 14-8 16-14-2-16-8 2-14 10-16z"
        fill="#2D8B7A"
      />
      <path
        d="M90 115c10-3 20 2 24 10s2 18-6 22-18 2-24-6 2-20 6-26z"
        fill="#2D8B7A"
      />
      <path
        d="M125 100c8-2 14 4 12 12s-10 12-16 8-10-10-6-16c2-2 6-4 10-4z"
        fill="#2D8B7A"
      />
      
      {/* Inner glow with pulse */}
      <motion.circle 
        cx="85" 
        cy="85" 
        r="20" 
        fill="#6BC9B8" 
        opacity="0.5"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.svg>
  )
}

// Avatar on globe
function GlobeAvatar({ 
  position, 
  imageUrl, 
  name 
}: { 
  position: 'top' | 'right' | 'left' | 'bottom'
  imageUrl?: string
  name?: string 
}) {
  const positionClasses = {
    top: 'top-2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    right: 'right-2 top-1/2 translate-x-1/2 -translate-y-1/2',
    left: 'left-2 top-1/2 -translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-2 left-1/2 -translate-x-1/2 translate-y-1/2'
  }

  return (
    <div className={cn('absolute', positionClasses[position])}>
      <div className="w-8 h-8 rounded-full border-3 border-white shadow-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40">
        {imageUrl ? (
          <img src={imageUrl} alt={name || 'User'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <User className="w-5 h-5 text-primary/60" />
          </div>
        )}
      </div>
    </div>
  )
}

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
  const [isConnecting, setIsConnecting] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
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
      // Match found - navigate to room page after showing connecting screen briefly
      const timer = setTimeout(() => {
        router.push(`/room/${matchData.matchId}?join=true`)
      }, 2000) // Show connecting screen for 2 seconds

      return () => clearTimeout(timer)
    }
  }, [isMatched, matchData, practiceState, router])

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
        // Show Screen 1: Searching (পার্টনার খোঁজা হচ্ছে...)
        setPracticeState('matching')
        setCreatedRoom(data.room)
        setIsWaitingForReceiver(true)
        
        // Subscribe to Pusher channel for this room
        const channel = pusherClient.subscribe(`room-${data.room.roomId}`)
        channel.bind('receiver-joined', (joinData: any) => {
          // Screen 2: Connecting (কানেক্ট হচ্ছে...)
          setIsConnecting(true)
          
          // Wait 2 seconds showing connecting screen, then navigate to room
          setTimeout(() => {
            router.push(`/room/${data.room.roomId}?join=true`)
          }, 2000)
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
                  <>
                  {/* Duolingo-style Video Call Section */}
                  <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
                    {/* Earth Globe with Avatars */}
                    <div className="relative w-48 h-48 md:w-56 md:h-56 mb-8">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative w-full h-full"
                      >
                        <EarthGlobe className="w-full h-full" />
                        {/* Avatars positioned on globe */}
                        <GlobeAvatar position="top" />
                        <GlobeAvatar position="right" />
                        <GlobeAvatar position="left" />
                        <GlobeAvatar position="bottom" />
                      </motion.div>
                    </div>

                    {/* Camera Toggle */}
                    <div className="flex items-center gap-3 mb-6">
                      <span className={cn('text-sm text-muted-foreground', textClass)}>
                        {t('practice.camera')}:
                      </span>
                      <button
                        onClick={() => setCameraEnabled(!cameraEnabled)}
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors duration-300',
                          cameraEnabled ? 'bg-[#1CB0F6]' : 'bg-gray-300'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300',
                            cameraEnabled ? 'left-7' : 'left-1'
                          )}
                        />
                      </button>
                      <span className={cn(
                        'text-sm font-medium',
                        cameraEnabled ? 'text-[#1CB0F6]' : 'text-muted-foreground'
                      )}>
                        {cameraEnabled ? t('practice.cameraOn') : t('practice.cameraOff')}
                      </span>
                    </div>

                    {/* Description Text */}
                    <p className={cn(
                      'text-center text-foreground/80 text-base md:text-lg mb-8 max-w-xs',
                      textClass
                    )}>
                      {t('practice.findSpeakingPartner')}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                      

                      {/* Primary Button - Find Partner */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreateCall}
                        disabled={creatingCall || isWaitingForReceiver}
                        className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-[#1CB0F6] text-white font-bold shadow-lg hover:bg-[#1899D6] transition-colors disabled:opacity-70"
                      >
                        {creatingCall || isWaitingForReceiver ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Video className="w-5 h-5" />
                        )}
                        <span className={textClass}>
                          {creatingCall || isWaitingForReceiver ? t('practice.searching') : t('practice.findPartnerBtn')}
                        </span>
                      </motion.button>
                    </div>

                    {/* Alternative Options */}
                    <div className="flex gap-4 mt-8">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/practice/quiz')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
                      >
                        <Brain className="w-4 h-4" />
                        <span className={cn('text-sm', textClass)}>{t('practice.soloPracticeBtn')}</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push('/practice/ai-call')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-secondary-foreground hover:bg-secondary transition-colors"
                      >
                        <Bot className="w-4 h-4" />
                        <span className={cn('text-sm', textClass)}>{t('practice.aiPracticeBtn')}</span>
                      </motion.button>
                    </div>
                  </div>
                </>
                </motion.div>
              )}

              {practiceState === 'matching' && isWaitingForReceiver && !isConnecting && (
                <motion.div
                  key="matching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full pb-20 px-4"
                >
                  {/* Globe with searching avatars */}
                  <div className="relative w-48 h-48 md:w-56 md:h-56 mb-8">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="relative w-full h-full"
                    >
                      <EarthGlobe className="w-full h-full" />
                      {/* Searching avatars - animated bouncing */}
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      >
                        <GlobeAvatar position="top" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                      >
                        <GlobeAvatar position="right" />
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                      >
                        <GlobeAvatar position="bottom" />
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Searching Text */}
                  <h2 className={cn('text-xl font-semibold mb-4 text-center', textClass)}>
                    {t('practice.searching')}
                  </h2>

                  {/* Cancel Search Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCancelMatching}
                    className="text-[#1CB0F6] font-medium text-sm mb-8"
                  >
                    {t('practice.cancel')} {t('practice.search')}
                  </motion.button>

                  {/* Quote Section */}
                  <div className="flex flex-col items-center max-w-xs">
                    <div className="flex items-center gap-4 w-full mb-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-muted-foreground text-2xl">❝</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    
                    <p className={cn('text-center text-muted-foreground text-sm italic', textClass)}>
                      {t('practice.quote')}
                    </p>
                    
                    <p className={cn('text-center text-muted-foreground text-xs mt-2', textClass)}>
                      — {t('practice.quoteAuthor')}
                    </p>
                  </div>
                </motion.div>
              )}

              {practiceState === 'matching' && isConnecting && createdRoom && (
                <motion.div
                  key="connecting"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-full pb-20 px-4"
                >
                  {/* Two Avatars Side by Side */}
                  <div className="flex items-center justify-center gap-8 mb-8">
                    {/* Current User Avatar */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                        <User className="w-10 h-10 text-primary/60" />
                      </div>
                      <span className={cn('text-sm font-medium mt-2 text-foreground', textClass)}>
                        {session?.user?.name || t('practice.you')}
                      </span>
                    </div>

                    {/* Partner Avatar */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <span className={cn('text-sm font-medium mt-2 text-foreground', textClass)}>
                        {t('practice.partner')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full max-w-xs mb-6">
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#1CB0F6] to-[#1899D6]"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, ease: 'easeInOut' }}
                        onAnimationComplete={() => {
                          // Navigate to room after progress bar fills
                          router.push(`/room/${createdRoom.roomId}?join=true`)
                        }}
                      />
                    </div>
                  </div>

                  {/* Connecting Text */}
                  <h2 className={cn('text-xl font-semibold mb-2 text-center', textClass)}>
                    {t('practice.connecting')}...
                  </h2>
                  
                  {/* Warning Text */}
                  <p className={cn('text-sm text-muted-foreground text-center', textClass)}>
                    {t('practice.doNotSwitch')}
                  </p>
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
