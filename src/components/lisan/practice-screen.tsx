'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Video, Users, Loader2, User, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'
import { AgoraVideoCall } from './agora-video-call'
import { usePusherMatching } from '@/hooks/usePusherMatching'

export function PracticeScreen() {
  const { practiceState, setPracticeState, callTimer, setCallTimer } = useAppStore()
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
          channelName: matchData.channelName,
          uid: userId,
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

        {/* Connection Status */}
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPusherConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {isPusherConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
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
              <div className="relative mb-8">
                <div className="w-40 h-40 rounded-full gradient-islamic flex items-center justify-center shadow-xl">
                  <Video className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-full bg-accent flex items-center justify-center border-4 border-background">
                  <span className="text-xl">🗣️</span>
                </div>
              </div>

              <h2 className="text-xl font-bold bengali-text mb-2">আরবি কথা বলুন</h2>
              

              <div className="flex flex-col gap-3 w-full max-w-xs">
                {session?.user ? (
                  <Button
                    onClick={handleCreateCall}
                    disabled={creatingCall}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 px-8 text-lg font-semibold shadow-lg w-full"
                  >
                    {creatingCall ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Video className="w-5 h-5" />
                    )}
                    <span className="bengali-text">
                      {creatingCall ? 'কল তৈরি হচ্ছে...' : 'কল করুন'}
                    </span>
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-secondary/50 rounded-xl">
                    <p className="text-sm text-muted-foreground bengali-text mb-2">
                      ভিডিও কল করতে লগইন করুন
                    </p>
                  </div>
                )}
                
               
              </div>

              
            </motion.div>
          )}

          {/* MATCHING STATE */}
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
                  Queue Position: {queuePosition}
                </p>
              )}

             

              <Button
                variant="ghost"
                onClick={handleCancelMatching}
                className="mt-8 text-muted-foreground bengali-text"
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
              className="flex flex-col items-center justify-center h-full pb-20 px-4"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-xl font-bold text-emerald-500 bengali-text mb-2">
                পার্টনার পাওয়া গেছে!
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-2">
                Partner: {matchData.partnerName}
              </p>
              <p className="text-xs text-muted-foreground text-center mb-6">
                Channel: {matchData.channelName}
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
              {!process.env.NEXT_PUBLIC_AGORA_APP_ID ? (
                <div className="flex flex-col items-center justify-center h-full p-4">
                  <div className="p-4 bg-destructive/10 rounded-xl text-center">
                    <p className="text-destructive font-medium mb-2">⚠️ Agora App ID Missing</p>
                    <p className="text-sm text-muted-foreground">.env file এ NEXT_PUBLIC_AGORA_APP_ID যোগ করুন</p>
                  </div>
                </div>
              ) : (
                <AgoraVideoCall
                  appId={process.env.NEXT_PUBLIC_AGORA_APP_ID}
                  channel={matchData.channelName}
                  token={agoraToken}
                  uid={userId}
                  onLeave={handleLeaveCall}
                  callTimer={callTimer}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PracticeScreen
