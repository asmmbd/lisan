'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useCallback } from 'react'
import { Video, Clock, Users, Loader2, PhoneOff, ArrowRight, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { AgoraVideoCall } from './agora-video-call'
import { useMatching } from '@/hooks/useMatching'

export function PracticeScreen() {
  const { practiceState, setPracticeState, callTimer, setCallTimer } = useAppStore()
  
  const {
    isConnected: isSocketConnected,
    isWaiting,
    isMatched,
    matchData,
    queuePosition,
    waitingMessage,
    error: matchingError,
    findPartner,
    cancelMatching,
    endCall,
    partnerLeft,
    partnerDisconnected,
  } = useMatching()

  // Countdown timer during call
  useEffect(() => {
    if (practiceState !== 'incall') return
    const interval = setInterval(() => {
      setCallTimer(Math.max(0, callTimer - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [practiceState, callTimer, setCallTimer])

  // Handle match found - auto join call
  useEffect(() => {
    if (isMatched && matchData && practiceState === 'matching') {
      console.log('🎯 Match found! Starting call...', matchData)
      setPracticeState('incall')
      setCallTimer(240)
    }
  }, [isMatched, matchData, practiceState, setPracticeState, setCallTimer])

  // Handle partner leaving
  useEffect(() => {
    if (partnerLeft || partnerDisconnected) {
      setPracticeState('idle')
      setCallTimer(240)
    }
  }, [partnerLeft, partnerDisconnected, setPracticeState, setCallTimer])

  const startMatching = () => {
    setPracticeState('matching')
    findPartner()
  }

  const handleCancelMatching = () => {
    cancelMatching()
    setPracticeState('idle')
  }

  const handleLeaveCall = () => {
    endCall()
    setPracticeState('idle')
    setCallTimer(240)
  }

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold bengali-text">প্র্যাকটিস</h1>
        <p className="text-sm text-muted-foreground bengali-text">আরবি কথোপকথন অনুশীলন</p>
        
        {/* Error Message */}
        {matchingError && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive bengali-text flex items-center gap-2">
              <span>⚠️</span>
              {matchingError}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {/* IDLE STATE */}
          {practiceState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center h-full pb-20"
            >
              {/* Decorative circle */}
              <div className="relative mb-8">
                <div className="w-40 h-40 rounded-full gradient-islamic flex items-center justify-center shadow-xl">
                  <Video className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-full bg-accent flex items-center justify-center border-4 border-background">
                  <span className="text-xl">🗣️</span>
                </div>
              </div>

              <h2 className="text-xl font-bold bengali-text mb-2">আরবি কথা বলুন</h2>
              <p className="text-sm text-muted-foreground text-center max-w-xs mb-8 bengali-text">
                র্যান্ডম পার্টনারের সাথে ভিডিও কলে আরবি অনুশীলন করুন
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Button
                  onClick={startMatching}
                  disabled={!isSocketConnected}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-8 text-lg font-semibold shadow-lg w-full"
                >
                  <Search className="w-5 h-5" />
                  <span className="bengali-text">
                    {!isSocketConnected ? 'কানেক্ট হচ্ছে...' : 'পার্টনার খুঁজুন'}
                  </span>
                </Button>
                
                <p className="text-xs text-muted-foreground text-center bengali-text mt-2">
                  Powered by Agora.io + Matching Server
                </p>
              </div>

              {/* Quick tips */}
              <div className="mt-8 w-full max-w-xs">
                <p className="text-xs text-muted-foreground text-center mb-3 bengali-text">কিভাবে কাজ করে</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3">
                    <span className="text-base">1️⃣</span>
                    <p className="text-xs text-card-foreground bengali-text">"পার্টনার খুঁজুন" চাপুন</p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3">
                    <span className="text-base">2️⃣</span>
                    <p className="text-xs text-card-foreground bengali-text">সিস্টেম অটো র্যান্ডম পার্টনার খুঁজবে</p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3">
                    <span className="text-base">3️⃣</span>
                    <p className="text-xs text-card-foreground bengali-text">মিলে গেলে অটো কল শুরু হবে!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MATCHING STATE - Finding Partner */}
          {practiceState === 'matching' && !isMatched && (
            <motion.div
              key="matching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full pb-20 px-4"
            >
              <div className="relative mb-6">
                <div className="relative w-28 h-28">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-3 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
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
                {isWaiting ? waitingMessage : 'পার্টনার খোঁজা হচ্ছে...'}
              </motion.h2>
              
              {isWaiting && (
                <p className="text-sm text-muted-foreground bengali-text text-center">
                  Queue Position: {queuePosition}
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center max-w-xs mt-4">
                এখন অন্য কেউ খুঁজলে আপনাদের মিলিয়ে দেওয়া হবে...
              </p>

              <Button
                variant="ghost"
                onClick={handleCancelMatching}
                className="mt-8 text-muted-foreground bengali-text"
              >
                বাতিল করুন
              </Button>
            </motion.div>
          )}

          {/* MATCHED STATE - Show partner found */}
          {practiceState === 'matching' && isMatched && matchData && (
            <motion.div
              key="matched"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full pb-20 px-4"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-emerald-500 bengali-text mb-2">
                পার্টনার পাওয়া গেছে!
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                কল শুরু হচ্ছে...
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
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <AgoraVideoCall
                appId={process.env.NEXT_PUBLIC_AGORA_APP_ID || ''}
                channel={matchData.channel}
                token="" // Will be fetched by API
                uid={matchData.partnerId}
                onLeave={handleLeaveCall}
                callTimer={callTimer}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PracticeScreen
