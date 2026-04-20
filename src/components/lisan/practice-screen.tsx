'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Video, Users, Loader2, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { AgoraVideoCall } from './agora-video-call'
import { usePusherMatching } from '@/hooks/usePusherMatching'
import { QuizView } from './quiz-view'
import { Brain, Trophy, ChevronRight, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

function PracticeSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header Skeleton */}
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-4xl mx-auto w-full">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Cards Skeleton */}
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
    quizState,
    startQuiz,
    vocabulary,
    isLoading
  } = useAppStore()
  const { data: session } = useSession()
  const userId = session?.user?.id || 'guest'
  const [agoraToken, setAgoraToken] = useState('')
  
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

  // Countdown timer during call
  useEffect(() => {
    if (practiceState !== 'incall') return
    const interval = setInterval(() => {
      setCallTimer(Math.max(0, callTimer - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [practiceState, callTimer, setCallTimer])

  // Handle match found - fetch token and start call
  useEffect(() => {
    if (isMatched && matchData && practiceState === 'matching') {
      console.log('🎯 Match found! Fetching Agora token...', matchData)
      
      // Fetch Agora token for the channel
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
        if (data.token) {
          setAgoraToken(data.token)
          setPracticeState('incall')
          setCallTimer(240)
        } else {
          console.error('Failed to get Agora token:', data.error)
          // Try without token for testing
          setAgoraToken('')
          setPracticeState('incall')
          setCallTimer(240)
        }
      })
      .catch(err => {
        console.error('Error fetching token:', err)
        // Proceed without token for testing
        setAgoraToken('')
        setPracticeState('incall')
        setCallTimer(240)
      })
    }
  }, [isMatched, matchData, practiceState, setPracticeState, setCallTimer, userId])

  // Handle partner leaving
  useEffect(() => {
    if (partnerLeft) {
      setPracticeState('idle')
      setCallTimer(240)
    }
  }, [partnerLeft, setPracticeState, setCallTimer])

  const [creatingCall, setCreatingCall] = useState(false)
  const router = useRouter()

  // Create a new call room (WhatsApp style)
  const handleCreateCall = async () => {
    if (!session?.user) {
      alert('Please login to make a call')
      return
    }

    setCreatingCall(true)
    try {
      const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const res = await fetch('/api/calls/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName }),
      })

      const data = await res.json()

      if (data.success) {
        // Navigate to the room
        router.push(`/room/${data.room.roomId}`)
      } else {
        console.error('Failed to create call:', data.error)
      }
    } catch (err) {
      console.error('Error creating call:', err)
    } finally {
      setCreatingCall(false)
    }
  }

  const startMatching = () => {
    setPracticeState('matching')
    findPartner(userId, 'Guest')
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

  // Show skeleton while loading (after all hooks)
  if (isLoading || vocabulary.length === 0) {
    return <PracticeSkeleton />
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Quiz Overlay */}
      {quizState !== 'idle' ? (
        <QuizView />
      ) : (
        <>
          <div className="px-4 pt-6 md:pt-10 pb-4 max-w-4xl mx-auto w-full">
            <h1 className="text-xl md:text-3xl font-black bengali-text text-center md:text-left">প্র্যাকটিস</h1>
            <p className="text-sm md:text-base text-muted-foreground bengali-text text-center md:text-left mt-1">আপনার আরবি দক্ষতা যাচাই করুন</p>

            {/* Error Message */}
            {matchingError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive bengali-text flex items-center gap-2">
                  <span>⚠️</span>
                  {matchingError}
                </p>
              </div>
            )}

            {/* Connection Status */}
            <div className="mt-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPusherConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-[10px] text-muted-foreground">
                {isPusherConnected ? 'Live matching ready' : 'Live matching offline'}
              </span>
            </div>
          </div>

          <div className="flex-1 px-4 max-w-4xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24 md:pb-10">
            <AnimatePresence mode="wait">
              {/* IDLE STATE */}
              {practiceState === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6"
                >
                  {/* Solo Practice Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startQuiz({ title: 'দৈনিক প্র্যাকটিস' })}
                    className="group relative overflow-hidden bg-card rounded-xl border border-border shadow-md p-6 cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex flex-col gap-1">
                        <Badge className="w-fit mb-2 bg-primary/20 text-primary hover:bg-primary/20 border-0">মোড: সোলো</Badge>
                        <h3 className="text-xl font-bold bengali-text">ইন্টারেক্টিভ কুইজ</h3>
                        <p className="text-sm text-muted-foreground bengali-text">নতুন শব্দ শিখুন এবং দক্ষতা যাচাই করুন</p>
                      </div>
                      <div className="w-14 h-14 rounded-xl gradient-islamic flex items-center justify-center shadow-lg transform rotate-3 transition-transform group-hover:rotate-0">
                        <Brain className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between relative z-10">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px]">
                                {i === 1 ? '🇦' : i === 2 ? '🇧' : '🇨'}
                            </div>
                          ))}
                        <div className="w-8 h-8 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                          +{vocabulary.length > 3 ? vocabulary.length - 3 : 0}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <span className="bengali-text">শুরু করুন</span>
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                  </motion.div>

                  {/* No divider on desktop grid */}
                  <div className="md:hidden relative flex items-center gap-4 px-4">
                    <div className="flex-1 h-[1px] bg-border" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bengali-text">অথবা</span>
                    <div className="flex-1 h-[1px] bg-border" />
                  </div>

                  {/* Live Call Card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateCall}
                    className="group relative overflow-hidden bg-secondary/30 rounded-xl border border-border/50 shadow-sm p-6 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                         <Badge className="w-fit mb-2 bg-islamic-gold/20 text-islamic-gold hover:bg-islamic-gold/20 border-0">মোড: লাইভ</Badge>
                        <h3 className="text-xl font-bold bengali-text">পার্টনারের সাথে কথা বলুন</h3>
                        <p className="text-sm text-muted-foreground bengali-text">সরাসরি কথোপকথনের মাধ্যমে উন্নতি করুন</p>
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-white dark:bg-card flex items-center justify-center shadow-md border border-border transition-transform group-hover:scale-105">
                        <Video className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <div className="mt-8 flex items-center gap-2 text-primary text-sm font-semibold">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="bengali-text">এখনই কল করুন</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* MATCHING STATE */}
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
                    className="text-lg font-semibold bengali-text mb-2"
                  >
                    {isWaiting ? 'পার্টনারের জন্য অপেক্ষা...' : 'পার্টনার খোঁজা হচ্ছে...'}
                  </motion.h2>
                  
                  {isWaiting && (
                    <p className="text-sm text-muted-foreground bengali-text text-center">
                      সারিবদ্ধ অবস্থান: {queuePosition}
                    </p>
                  )}

                  <Button
                    variant="ghost"
                    onClick={handleCancelMatching}
                    className="mt-8 text-muted-foreground bengali-text border border-border rounded-xl"
                  >
                    বাতিল করুন
                  </Button>
                </motion.div>
              )}

              {/* MATCHED STATE */}
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
                  
                  <h2 className="text-xl font-bold text-emerald-500 bengali-text mb-2">
                    পার্টনার পাওয়া গেছে!
                  </h2>
                  <p className="text-sm text-muted-foreground text-center mb-8">
                    {matchData.partnerName} এর সাথে কানেক্ট করা হচ্ছে...
                  </p>
                  
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </motion.div>
              )}

              {/* VIDEO CALL STATE */}
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
                          {!process.env.NEXT_PUBLIC_AGORA_APP_ID ? '⚠️ Configuration Error' : '⏳ Connecting...'}
                        </p>
                        <p className="text-xs opacity-70">
                          {agoraToken ? 'Starting call...' : 'Fetching Agora token...'}
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
      )}
    </div>
  )
}

export default PracticeScreen
