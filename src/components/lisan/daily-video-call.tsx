'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import DailyIframe, { DailyCall } from '@daily-co/daily-js'
import { PhoneOff, Mic, MicOff, Video, VideoOff, Clock, User } from 'lucide-react'

interface DailyVideoCallProps {
  roomUrl: string
  userName: string
  onLeave: () => void
  callTimer: number
}

export function DailyVideoCall({ roomUrl, userName, onLeave, callTimer }: DailyVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callRef = useRef<DailyCall | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [participants, setParticipants] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    console.log('Starting Daily.co call, room:', roomUrl)

    // Create call object
    const call = DailyIframe.createCallObject()
    callRef.current = call

    // Set up event handlers
    call.on('joined-meeting', () => {
      console.log('Joined meeting')
      setIsConnected(true)
    })

    call.on('left-meeting', () => {
      console.log('Left meeting')
      setIsConnected(false)
    })

    call.on('participant-joined', () => {
      setParticipants(prev => prev + 1)
    })

    call.on('participant-left', () => {
      setParticipants(prev => Math.max(1, prev - 1))
    })

    call.on('error', (e: any) => {
      console.error('Daily.co error:', e)
      setError(e.errorMsg || 'Call error occurred')
    })

    // Join the room
    call.join({ 
      url: roomUrl,
      userName: userName,
      showLeaveButton: false,
      showFullscreenButton: true,
    }).then(() => {
      console.log('Successfully joined Daily room')
    }).catch((err) => {
      console.error('Failed to join:', err)
      setError('কলে যোগ দিতে ব্যর্থ হয়েছে')
    })

    return () => {
      console.log('Cleaning up Daily call')
      call.leave()
      call.destroy()
    }
  }, [roomUrl, userName])

  const handleLeave = () => {
    if (callRef.current) {
      callRef.current.leave()
      callRef.current.destroy()
      callRef.current = null
    }
    onLeave()
  }

  const toggleMute = () => {
    if (callRef.current) {
      const newState = !isMuted
      callRef.current.setLocalAudio(!newState)
      setIsMuted(newState)
    }
  }

  const toggleVideo = () => {
    if (callRef.current) {
      const newState = !isCameraOff
      callRef.current.setLocalVideo(!newState)
      setIsCameraOff(newState)
    }
  }

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Video Container */}
      <div 
        ref={containerRef}
        className="relative flex-1 bg-black rounded-2xl overflow-hidden mb-3 min-h-[280px]"
      >
        {/* Daily.co iframe will be injected here */}
        <div 
          id="daily-container"
          className="w-full h-full"
          style={{ 
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Placeholder while connecting */}
          {!isConnected && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-card to-secondary/30">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full gradient-islamic flex items-center justify-center mx-auto mb-3 shadow-lg animate-pulse">
                  <User className="w-12 h-12 text-white" />
                </div>
                <p className="text-sm font-medium bengali-text">কানেক্ট হচ্ছে...</p>
                <p className="text-xs text-muted-foreground">Daily.co</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
              <div className="text-center p-4">
                <p className="text-sm text-destructive bengali-text">{error}</p>
                <button 
                  onClick={handleLeave}
                  className="mt-4 px-4 py-2 bg-destructive text-white rounded-lg text-sm"
                >
                  ফিরে যান
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-mono">{formatTime(callTimer)}</span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />
          )}
        </div>

        {/* Participant count */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
          <span className="text-white text-xs">
            {participants} জন
          </span>
        </div>

        {/* Conversation hint */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-xl p-3 z-10">
          <p className="text-xs text-white/90 bengali-text">
            💡 বিষয়: দৈনন্দিন জীবন - সকালের রুটিন সম্পর্কে কথা বলুন
          </p>
        </div>
      </div>

      {/* Call controls */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={toggleMute}
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
          onClick={toggleVideo}
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
          onClick={handleLeave}
          className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}

export default DailyVideoCall
