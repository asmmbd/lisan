'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { Phone, PhoneOff, Video, Clock, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { AgoraVideoCall } from './agora-video-call'

export function PracticeScreen() {
  const { practiceState, setPracticeState, callTimer, setCallTimer } = useAppStore()
  const [agoraConfig, setAgoraConfig] = useState<{
    appId: string
    channel: string
    token: string
    uid: string
  } | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Countdown timer during call
  useEffect(() => {
    if (practiceState !== 'incall') return
    const interval = setInterval(() => {
      setCallTimer(Math.max(0, callTimer - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [practiceState, callTimer, setCallTimer])

  // Create Agora channel and get token
  const createRoom = async () => {
    try {
      setIsCreatingRoom(true)
      setError(null)

      const channelName = `lisan-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
      const uid = Math.floor(Math.random() * 100000).toString()

      // Get token from API
      const response = await fetch('/api/agora-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channelName,
          uid: uid,
          role: 'publisher',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }

      console.log('✅ Agora room created:', channelName)
      
      setAgoraConfig({
        appId: data.appId,
        channel: channelName,
        token: data.token,
        uid: uid,
      })
      
      setPracticeState('matching')
      
      // Auto join after short delay
      setTimeout(() => {
        setPracticeState('incall')
        setCallTimer(240)
      }, 1500)

    } catch (err: any) {
      console.error('Error creating Agora room:', err)
      setError('রুম তৈরি করতে ব্যর্থ: ' + (err.message || 'Unknown error'))
      setPracticeState('idle')
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const startPractice = () => {
    createRoom()
  }

  const handleLeaveCall = () => {
    setPracticeState('idle')
    setAgoraConfig(null)
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
        {error && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive bengali-text flex items-center gap-2">
              <span>⚠️</span>
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-destructive underline hover:no-underline bengali-text"
            >
              পেজ রিলোড করুন
            </button>
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
                ভিডিও কলের মাধ্যমে আরবি ভাষায় কথোপকথন অনুশীলন করুন
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={startPractice}
                  disabled={isCreatingRoom}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-8 text-lg font-semibold shadow-lg"
                >
                  {isCreatingRoom ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                  <span className="bengali-text">
                    {isCreatingRoom ? 'রুম তৈরি হচ্ছে...' : 'ভিডিও প্র্যাকটিস'}
                  </span>
                </Button>
                
                <p className="text-xs text-muted-foreground text-center bengali-text">
                  Powered by Agora.io (10,000 min free/month)
                </p>
              </div>

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
                রুম তৈরি হচ্ছে...
              </motion.h2>
              <p className="text-sm text-muted-foreground bengali-text text-center max-w-xs">
                Agora ভিডিও কল রুম প্রস্তুত করা হচ্ছে
              </p>

              {agoraConfig && (
                <div className="mt-4 p-3 bg-secondary/50 rounded-lg max-w-xs">
                  <p className="text-xs text-muted-foreground mb-1">Channel: {agoraConfig.channel}</p>
                  <p className="text-xs text-muted-foreground">শেয়ার করুন: আরেকজন একই Channel name ব্যবহার করলে join করতে পারবে</p>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => setPracticeState('idle')}
                className="mt-8 text-muted-foreground bengali-text"
              >
                বাতিল করুন
              </Button>
            </motion.div>
          )}

          {/* VIDEO CALL STATE */}
          {practiceState === 'incall' && agoraConfig && (
            <motion.div
              key="incall"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <AgoraVideoCall
                appId={agoraConfig.appId}
                channel={agoraConfig.channel}
                token={agoraConfig.token}
                uid={agoraConfig.uid}
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
