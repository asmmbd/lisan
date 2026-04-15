'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

export function PracticeScreen() {
  const { practiceState, setPracticeState, callTimer, setCallTimer } = useAppStore()
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)

  // Countdown timer during call
  useEffect(() => {
    if (practiceState !== 'incall') return
    const interval = setInterval(() => {
      setCallTimer(Math.max(0, callTimer - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [practiceState, callTimer, setCallTimer])

  // Auto transition: matching → incoming after 3s
  useEffect(() => {
    if (practiceState !== 'matching') return
    const timeout = setTimeout(() => {
      setPracticeState('incoming')
    }, 3000)
    return () => clearTimeout(timeout)
  }, [practiceState, setPracticeState])

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const startPractice = () => {
    setPracticeState('matching')
  }

  const acceptCall = () => {
    setCallTimer(240)
    setPracticeState('incall')
  }

  const rejectCall = () => {
    setPracticeState('idle')
  }

  const endCall = () => {
    setPracticeState('idle')
    setCallTimer(240)
    setIsMuted(false)
    setIsCameraOff(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold bengali-text">প্র্যাকটিস</h1>
        <p className="text-sm text-muted-foreground bengali-text">আরবি কথোপকথন অনুশীলন</p>
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
                ভিডিও কলের মাধ্যমে আরবি ভাষায় কথোপকথন অনুশীলন করুন এবং আপনার দক্ষতা বাড়ান
              </p>

              <Button
                onClick={startPractice}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-8 text-lg font-semibold shadow-lg"
              >
                <Phone className="w-5 h-5" />
                <span className="bengali-text">প্র্যাকটিস শুরু করুন</span>
              </Button>

              {/* Quick tips */}
              <div className="mt-8 w-full max-w-xs">
                <p className="text-xs text-muted-foreground text-center mb-3 bengali-text">প্র্যাকটিস টিপস</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3">
                    <span className="text-base">🎯</span>
                    <p className="text-xs text-card-foreground bengali-text">নির্দিষ্ট বিষয়ে কথা বলার চেষ্টা করুন</p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3">
                    <span className="text-base">⏱️</span>
                    <p className="text-xs text-card-foreground bengali-text">প্রতিটি সেশন ৪ মিনিটের হবে</p>
                  </div>
                  <div className="flex items-center gap-2 bg-secondary/50 rounded-xl p-3">
                    <span className="text-base">💡</span>
                    <p className="text-xs text-card-foreground bengali-text">ভুল করতে ভয় পাবেন না, শিখুন!</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MATCHING STATE */}
          {practiceState === 'matching' && (
            <motion.div
              key="matching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full pb-20"
            >
              <div className="relative mb-8">
                {/* Pulsing rings */}
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute inset-3 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                  <div className="absolute inset-6 rounded-full bg-primary/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '1s' }} />
                  <div className="relative w-32 h-32 rounded-full gradient-islamic flex items-center justify-center z-10">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              <motion.h2
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-lg font-semibold bengali-text mb-2"
              >
                পার্টনার খোঁজা হচ্ছে...
              </motion.h2>
              <p className="text-sm text-muted-foreground bengali-text">
                আপনার জন্য একজন পার্টনার খোঁজা হচ্ছে
              </p>

              <Button
                variant="ghost"
                onClick={() => setPracticeState('idle')}
                className="mt-8 text-muted-foreground bengali-text"
              >
                বাতিল করুন
              </Button>
            </motion.div>
          )}

          {/* INCOMING CALL STATE */}
          {practiceState === 'incoming' && (
            <motion.div
              key="incoming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full pb-20"
            >
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full gradient-islamic flex items-center justify-center">
                    <span className="text-3xl text-white font-bold">ع</span>
                  </div>
                </div>
                {/* Ringing animation */}
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping" style={{ animationDuration: '1.5s' }} />
              </div>

              <h2 className="text-lg font-semibold bengali-text mb-1">আগত কল</h2>
              <p className="text-sm text-muted-foreground bengali-text mb-8">একজন পার্টনার প্রস্তুত!</p>

              <div className="flex items-center gap-6">
                <button
                  onClick={rejectCall}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
                <button
                  onClick={acceptCall}
                  className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Phone className="w-7 h-7 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-6 mt-4">
                <span className="text-xs text-destructive font-medium bengali-text">প্রত্যাখ্যান</span>
                <span className="text-xs text-primary font-medium bengali-text">গ্রহণ</span>
              </div>
            </motion.div>
          )}

          {/* VIDEO CALL STATE */}
          {practiceState === 'incall' && (
            <motion.div
              key="incall"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full pb-20"
            >
              {/* Partner video area */}
              <div className="relative flex-1 bg-gradient-to-b from-card to-secondary/30 rounded-2xl overflow-hidden mb-3 min-h-[280px]">
                {/* Placeholder for partner video */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full gradient-islamic flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <span className="text-4xl text-white font-bold">ع</span>
                    </div>
                    <p className="text-sm font-medium bengali-text">আব্দুল্লাহ</p>
                    <p className="text-xs text-muted-foreground">পার্টনার</p>
                  </div>
                </div>

                {/* Self video (small) */}
                <div className="absolute top-3 right-3 w-24 h-32 rounded-xl bg-gradient-to-b from-primary/20 to-primary/10 border border-border flex items-center justify-center overflow-hidden">
                  {isCameraOff ? (
                    <VideoOff className="w-6 h-6 text-muted-foreground" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                      <span className="text-lg text-primary font-bold">আ</span>
                    </div>
                  )}
                </div>

                {/* Timer */}
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-mono">{formatTime(callTimer)}</span>
                </div>

                {/* Conversation hint */}
                <div className="absolute bottom-3 left-3 right-3 bg-black/50 backdrop-blur-sm rounded-xl p-3">
                  <p className="text-xs text-white/80 bengali-text">💡 বিষয়: দৈনন্দিন জীবন - সকালের রুটিন সম্পর্কে কথা বলুন</p>
                </div>
              </div>

              {/* Call controls */}
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isMuted ? 'bg-destructive' : 'bg-card border border-border'
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-5 h-5 text-white" />
                  ) : (
                    <Mic className="w-5 h-5 text-card-foreground" />
                  )}
                </button>

                <button
                  onClick={() => setIsCameraOff(!isCameraOff)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isCameraOff ? 'bg-destructive' : 'bg-card border border-border'
                  }`}
                >
                  {isCameraOff ? (
                    <VideoOff className="w-5 h-5 text-white" />
                  ) : (
                    <Video className="w-5 h-5 text-card-foreground" />
                  )}
                </button>

                <button
                  onClick={endCall}
                  className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
