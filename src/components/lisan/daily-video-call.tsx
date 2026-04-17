'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'
import { PhoneOff, Mic, MicOff, Video, VideoOff, Clock, User } from 'lucide-react'

interface DailyVideoCallProps {
  roomUrl: string
  userName: string
  onLeave: () => void
  callTimer: number
}

export function DailyVideoCall({ roomUrl, userName, onLeave, callTimer }: DailyVideoCallProps) {
  const frameRef = useRef<any>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [participants, setParticipants] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    console.log('Creating Daily iframe for room:', roomUrl)
    setIsLoading(true)

    try {
      // Create the iframe with the room URL directly
      const frame = DailyIframe.createFrame({
        showLeaveButton: false,
        showFullscreenButton: false,
        showParticipantsBar: false,
        iframeStyle: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: '0',
          left: '0',
          border: '0',
          borderRadius: '16px',
        },
      })

      frameRef.current = frame

      // Event handlers
      frame.on('joined-meeting', () => {
        console.log('✅ Joined meeting')
        setIsConnected(true)
        setIsLoading(false)
      })

      frame.on('left-meeting', () => {
        console.log('👋 Left meeting')
        setIsConnected(false)
      })

      frame.on('participant-joined', (e: any) => {
        console.log('👤 Participant joined:', e?.participant?.user_name)
        setParticipants(prev => prev + 1)
      })

      frame.on('participant-left', () => {
        console.log('👤 Participant left')
        setParticipants(prev => Math.max(1, prev - 1))
      })

      frame.on('error', (e: any) => {
        console.error('❌ Daily error:', e)
        setError(e?.errorMsg || 'কলে সমস্যা হয়েছে')
        setIsLoading(false)
      })

      // Join the room
      frame.join({ 
        url: roomUrl,
        userName: userName || 'Guest',
        startVideoOff: false,
        startAudioOff: false,
      }).then(() => {
        console.log('✅ Join initiated')
      }).catch((err: any) => {
        console.error('❌ Failed to join:', err)
        setError('কলে যোগ দিতে ব্যর্থ: ' + (err?.message || 'Unknown error'))
        setIsLoading(false)
      })

    } catch (err: any) {
      console.error('❌ Error creating frame:', err)
      setError('ভিডিও কল শুরু করতে ব্যর্থ: ' + err?.message)
      setIsLoading(false)
    }

    return () => {
      console.log('🧹 Cleaning up Daily frame')
      if (frameRef.current) {
        try {
          frameRef.current.leave()
          frameRef.current.destroy()
        } catch (e) {
          console.log('Cleanup error (safe to ignore):', e)
        }
      }
    }
  }, [roomUrl, userName])

  const handleLeave = () => {
    if (frameRef.current) {
      try {
        frameRef.current.leave()
        frameRef.current.destroy()
      } catch (e) {
        console.log('Leave error:', e)
      }
      frameRef.current = null
    }
    onLeave()
  }

  const toggleMute = () => {
    if (frameRef.current) {
      const newState = !isMuted
      frameRef.current.setLocalAudio(!newState)
      setIsMuted(newState)
    }
  }

  const toggleVideo = () => {
    if (frameRef.current) {
      const newState = !isCameraOff
      frameRef.current.setLocalVideo(!newState)
      setIsCameraOff(newState)
    }
  }

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Video Container - Daily iframe auto-injects here */}
      <div 
        id="daily-call-container"
        className="relative flex-1 bg-black rounded-2xl overflow-hidden mb-3 min-h-[280px]"
      >
        {/* Loading State */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 z-20">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                <User className="w-12 h-12 text-white" />
              </div>
              <p className="text-lg font-semibold text-white bengali-text mb-1">কানেক্ট হচ্ছে...</p>
              <p className="text-sm text-slate-400">Daily.co ভিডিও কল</p>
              <div className="mt-4 flex justify-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 z-20">
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-red-400 bengali-text mb-4">{error}</p>
              <button 
                onClick={handleLeave}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                ফিরে যান
              </button>
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-mono">{formatTime(callTimer)}</span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          )}
        </div>

        {/* Participant count */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
          <span className="text-white text-xs">
            👥 {participants}
          </span>
        </div>

        {/* Topic hint */}
        <div className="absolute bottom-16 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-xl p-3 z-10">
          <p className="text-xs text-white/90 bengali-text">
            💡 বিষয়: দৈনন্দিন জীবন - সকালের রুটিন সম্পর্কে কথা বলুন
          </p>
        </div>
      </div>

      {/* Call controls */}
      <div className="flex items-center justify-center gap-3 py-2">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isCameraOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        <button
          onClick={handleLeave}
          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}

export default DailyVideoCall
