'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Clock, Users, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { useSocket } from '@/hooks/useSocket'
import { useWebRTC } from '@/hooks/useWebRTC'
import { VideoCall } from './video-call'

export function PracticeScreen() {
  const { practiceState, setPracticeState, callTimer, setCallTimer } = useAppStore()
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [incomingCall, setIncomingCall] = useState<{ offer: RTCSessionDescriptionInit; callerId: string } | null>(null)
  
  // Socket connection for signaling
  const { socket, isConnected, onlineUsers, currentUserId } = useSocket()
  
  // WebRTC for video call
  const {
    localStream,
    remoteStream,
    isConnected: isRTCConnected,
    isConnecting: isRTCConnecting,
    error: rtcError,
    startCall,
    acceptCall: acceptWebRTCCall,
    endCall: endWebRTCCall,
    toggleMute,
    toggleVideo,
  } = useWebRTC(socket, currentUserId)

  // Countdown timer during call
  useEffect(() => {
    if (practiceState !== 'incall') return
    const interval = setInterval(() => {
      setCallTimer(Math.max(0, callTimer - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [practiceState, callTimer, setCallTimer])

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) {
      console.log('Socket not available yet')
      return
    }

    console.log('Setting up socket listeners, socket id:', socket.id)

    const handleCallOffer = ({ offer, callerId }: { offer: RTCSessionDescriptionInit; callerId: string }) => {
      console.log('Received call offer from:', callerId)
      setIncomingCall({ offer, callerId })
      setPracticeState('incoming')
    }

    const handleCallEnded = () => {
      console.log('Call ended received')
      handleEndCall()
    }

    const handleCallRejected = ({ by }: { by: string }) => {
      console.log('Call rejected by:', by)
      setPracticeState('idle')
    }

    socket.on('call-offer', handleCallOffer)
    socket.on('call-ended', handleCallEnded)
    socket.on('call-rejected', handleCallRejected)

    return () => {
      socket.off('call-offer', handleCallOffer)
      socket.off('call-ended', handleCallEnded)
      socket.off('call-rejected', handleCallRejected)
    }
  }, [socket, setPracticeState])

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  // Start looking for a partner (Video mode)
  const startPractice = () => {
    console.log('Starting practice, socket:', socket?.id, 'onlineUsers:', onlineUsers)
    setPracticeState('matching')
    
    // Try to find an online partner
    if (socket && onlineUsers.length > 0) {
      const randomPartner = onlineUsers[Math.floor(Math.random() * onlineUsers.length)]
      console.log('Calling partner:', randomPartner)
      startCall(randomPartner)
    } else {
      console.log('No online users found, waiting for someone to join...')
      // Keep in matching state, wait for someone to join
      // The online-users event will update the list
    }
  }

  // Start audio-only practice (for users without camera)
  const startPracticeAudioOnly = () => {
    console.log('Starting audio-only practice')
    setPracticeState('matching')
    setIsCameraOff(true)
    
    // Initialize media with audio only, then call
    if (socket && onlineUsers.length > 0) {
      const randomPartner = onlineUsers[Math.floor(Math.random() * onlineUsers.length)]
      console.log('Calling partner (audio-only):', randomPartner)
      startCall(randomPartner)
    }
  }

  // Auto-call when online users become available
  useEffect(() => {
    if (practiceState === 'matching' && onlineUsers.length > 0 && socket) {
      console.log('Online users now available, initiating call to:', onlineUsers[0])
      const randomPartner = onlineUsers[Math.floor(Math.random() * onlineUsers.length)]
      startCall(randomPartner)
    }
  }, [onlineUsers, practiceState, socket, startCall])

  // Accept incoming call
  const acceptCall = async () => {
    if (incomingCall) {
      await acceptWebRTCCall(incomingCall.offer, incomingCall.callerId)
      setCallTimer(240)
      setPracticeState('incall')
      setIncomingCall(null)
    }
  }

  // Reject incoming call
  const rejectCall = () => {
    setIncomingCall(null)
    setPracticeState('idle')
    if (socket && incomingCall) {
      socket.emit('call-rejected', { callerId: incomingCall.callerId })
    }
  }

  // End call
  const handleEndCall = () => {
    endWebRTCCall()
    setPracticeState('idle')
    setCallTimer(240)
    setIsMuted(false)
    setIsCameraOff(false)
    setIncomingCall(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold bengali-text">প্র্যাকটিস</h1>
        <p className="text-sm text-muted-foreground bengali-text">আরবি কথোপকথন অনুশীলন</p>
        
        {/* Error Message */}
        {rtcError && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive bengali-text flex items-center gap-2">
              <span>⚠️</span>
              {rtcError}
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
                ভিডিও কলের মাধ্যমে আরবি ভাষায় কথোপকথন অনুশীলন করুন এবং আপনার দক্ষতা বাড়ান
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={startPractice}
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-8 text-lg font-semibold shadow-lg"
                >
                  <Video className="w-5 h-5" />
                  <span className="bengali-text">ভিডিও প্র্যাকটিস</span>
                </Button>
                
                <Button
                  onClick={() => startPracticeAudioOnly()}
                  variant="outline"
                  className="gap-2 rounded-2xl h-12 px-6 text-base font-medium"
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="bengali-text">অডিও শুধু (ক্যামেরা নেই)</span>
                </Button>
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
                {onlineUsers.length === 0 ? 'পার্টনারের অপেক্ষায়...' : 'পার্টনার খোঁজা হচ্ছে...'}
              </motion.h2>
              <p className="text-sm text-muted-foreground bengali-text text-center max-w-xs">
                {onlineUsers.length === 0 
                  ? 'আরেকজন user join করার অপেক্ষায় আছি। দুই নম্বর ব্রাউজারে অ্যাপ খুলুন।' 
                  : `${onlineUsers.length} জন online আছেন। কল পাঠানো হচ্ছে...`}
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
              className="flex flex-col h-full"
            >
              <VideoCall
                localStream={localStream}
                remoteStream={remoteStream}
                isConnected={isRTCConnected}
                isConnecting={isRTCConnecting}
                callTimer={callTimer}
                partnerName={incomingCall?.callerId || 'পার্টনার'}
                onEndCall={handleEndCall}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
