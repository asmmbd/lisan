'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { Phone, PhoneOff, Video, Clock, Users, Loader2, Copy, Check, ArrowRight, LogIn } from 'lucide-react'
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
  const [copied, setCopied] = useState(false)
  const [joinChannelInput, setJoinChannelInput] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)

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

  const copyChannelName = () => {
    if (agoraConfig?.channel) {
      navigator.clipboard.writeText(agoraConfig.channel)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const joinRoom = async () => {
    if (!joinChannelInput.trim()) {
      setError('Channel name দিন')
      return
    }
    
    try {
      setIsJoining(true)
      setError(null)
      
      const uid = Math.floor(Math.random() * 100000).toString()
      
      // Get token for existing channel
      const response = await fetch('/api/agora-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: joinChannelInput.trim(),
          uid: uid,
          role: 'publisher',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join room')
      }

      console.log('✅ Joining Agora room:', joinChannelInput)
      
      setAgoraConfig({
        appId: data.appId,
        channel: joinChannelInput.trim(),
        token: data.token,
        uid: uid,
      })
      
      setPracticeState('incall')
      setCallTimer(240)
      
    } catch (err: any) {
      console.error('Error joining Agora room:', err)
      setError('রুমে join করতে ব্যর্থ: ' + (err.message || 'Unknown error'))
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveCall = () => {
    setPracticeState('idle')
    setAgoraConfig(null)
    setCallTimer(240)
    setJoinChannelInput('')
    setShowJoinInput(false)
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

              <div className="flex flex-col gap-3 w-full max-w-xs">
                {/* Create Room Button */}
                <Button
                  onClick={startPractice}
                  disabled={isCreatingRoom}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-8 text-lg font-semibold shadow-lg w-full"
                >
                  {isCreatingRoom ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Video className="w-5 h-5" />
                  )}
                  <span className="bengali-text">
                    {isCreatingRoom ? 'রুম তৈরি হচ্ছে...' : 'নতুন রুম তৈরি করুন'}
                  </span>
                </Button>

                {/* OR Divider */}
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">অথবা</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Join Room Input */}
                {!showJoinInput ? (
                  <Button
                    onClick={() => setShowJoinInput(true)}
                    variant="outline"
                    className="gap-2 rounded-2xl h-12 w-full border-2 border-dashed"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="bengali-text">আগের রুমে যোগ দিন</span>
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={joinChannelInput}
                        onChange={(e) => setJoinChannelInput(e.target.value)}
                        placeholder="Channel name লিখুন"
                        className="flex-1 px-4 py-2 rounded-xl border border-input bg-background text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                      />
                      <Button
                        onClick={joinRoom}
                        disabled={isJoining || !joinChannelInput.trim()}
                        className="px-4"
                      >
                        {isJoining ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <button
                      onClick={() => setShowJoinInput(false)}
                      className="text-xs text-muted-foreground hover:text-foreground bengali-text"
                    >
                      বাতিল করুন
                    </button>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground text-center bengali-text mt-2">
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

          {/* MATCHING STATE - Room Created */}
          {practiceState === 'matching' && (
            <motion.div
              key="matching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full pb-20 px-4"
            >
              <div className="relative mb-6">
                <div className="relative w-28 h-28">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center z-10 shadow-lg">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold bengali-text mb-2 text-center">রুম তৈরি হয়েছে!</h2>
              <p className="text-sm text-muted-foreground bengali-text text-center max-w-xs mb-6">
                নিচের Channel name কপি করে অন্যজনকে দিন
              </p>

              {agoraConfig && (
                <div className="w-full max-w-xs space-y-4">
                  {/* Channel Name Box */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-2xl p-4">
                    <p className="text-xs text-muted-foreground mb-2 bengali-text">Channel Name:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-black/50 text-emerald-400 px-3 py-2 rounded-lg text-sm font-mono break-all">
                        {agoraConfig.channel}
                      </code>
                      <button
                        onClick={copyChannelName}
                        className={`p-2 rounded-lg transition-colors ${
                          copied ? 'bg-emerald-500 text-white' : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-medium bengali-text">কিভাবে যোগ দিবেন:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 bengali-text list-decimal list-inside">
                      <li>উপরের Channel name কপি করুন</li>
                      <li>অন্য ফোনে "আগের রুমে যোগ দিন" চাপুন</li>
                      <li>Channel name পেস্ট করে Join করুন</li>
                    </ol>
                  </div>

                  {/* Auto join after delay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3 }}
                    className="text-center"
                  >
                    <Button
                      onClick={() => {
                        setPracticeState('incall')
                        setCallTimer(240)
                      }}
                      className="gap-2 bg-primary"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span className="bengali-text">কল শুরু করুন</span>
                    </Button>
                  </motion.div>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={() => setPracticeState('idle')}
                className="mt-6 text-muted-foreground bengali-text"
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
