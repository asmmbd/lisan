'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { PhoneOff, Mic, MicOff, Video, VideoOff, Clock, User, Users, ArrowLeft, MoreVertical, Camera, RefreshCw, Share2, MessageSquare } from 'lucide-react'

interface AgoraVideoCallProps {
  appId: string
  channel: string
  token: string
  uid: string | null
  onLeave: () => void
  callTimer: number
}

export function AgoraVideoCall({ appId, channel, token, onLeave, callTimer }: AgoraVideoCallProps) {
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<any>(null)
  const localAudioTrackRef = useRef<any>(null)
  const localVideoTrackRef = useRef<any>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [remoteUsers, setRemoteUsers] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(180) // 3 minutes countdown
  const [callStarted, setCallStarted] = useState(false)

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  // Countdown timer effect - 3 minutes
  useEffect(() => {
    if (!callStarted || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto end call
          clearInterval(timer)
          handleLeave()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [callStarted, timeRemaining])

  useEffect(() => {
    // Wait for token to be ready before initializing
    if (!appId || !channel) return

    let cancelled = false
    let AgoraRTC: any

    const initAgora = async () => {
      try {
        const AgoraModule = await import('agora-rtc-sdk-ng')
        AgoraRTC = AgoraModule.default

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client

        client.on('user-published', async (user: any, mediaType: string) => {
          await client.subscribe(user, mediaType)
          if (mediaType === 'video' && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current)
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play()
          }
          setRemoteUsers(prev => prev + 1)
        })

        client.on('user-unpublished', (user: any, mediaType: string) => {
          if (mediaType === 'video') user.videoTrack?.stop()
          if (mediaType === 'audio') user.audioTrack?.stop()
        })

        client.on('user-left', () => {
          setRemoteUsers(prev => Math.max(0, prev - 1))
        })

        if (cancelled) return

        const assignedUid = await client.join(appId, channel, token || null, null)
        console.log('✅ Joined, uid:', assignedUid)

        if (cancelled) {
          await client.leave().catch(() => {})
          return
        }

        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()

        if (cancelled) {
          audioTrack.stop(); audioTrack.close()
          videoTrack.stop(); videoTrack.close()
          await client.leave().catch(() => {})
          return
        }

        localAudioTrackRef.current = audioTrack
        localVideoTrackRef.current = videoTrack

        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }

        await client.publish([audioTrack, videoTrack])

        setIsConnected(true)
        setIsConnecting(false)

        // Start countdown when connected
        setCallStarted(true)

      } catch (err: any) {
        if (cancelled) return
        console.error('❌ Agora error:', err)
        setError(err.message || 'ভিডিও কল শুরু করতে ব্যর্থ')
        setIsConnecting(false)
      }
    }

    initAgora()

    return () => {
      cancelled = true
      localAudioTrackRef.current?.stop()
      localAudioTrackRef.current?.close()
      localVideoTrackRef.current?.stop()
      localVideoTrackRef.current?.close()
      clientRef.current?.leave().catch(() => {})
    }
  }, [appId, channel])

  const handleLeave = () => {
    localAudioTrackRef.current?.stop()
    localAudioTrackRef.current?.close()
    localVideoTrackRef.current?.stop()
    localVideoTrackRef.current?.close()
    
    clientRef.current?.leave().catch(() => {})
    onLeave()
  }

  const toggleMute = () => {
    const audioTrack = localAudioTrackRef.current
    if (audioTrack) {
      const newState = !isMuted
      audioTrack.setEnabled(!newState)
      setIsMuted(newState)
    }
  }

  const toggleVideo = () => {
    const videoTrack = localVideoTrackRef.current
    if (videoTrack) {
      const newState = !isCameraOff
      videoTrack.setEnabled(!newState)
      setIsCameraOff(newState)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1a237e]">
      {/* Header Bar - Blue gradient */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[#0d47a1] to-[#1565c0]">
        {/* Back Button */}
        <button 
          onClick={handleLeave}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Timer Pill */}
        <div className="flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
          <Clock className="w-4 h-4 text-white" />
          <span className="text-white font-medium text-sm">{formatTime(timeRemaining)}</span>
        </div>

        {/* More Options */}
        <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
          <MoreVertical className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Video Container */}
      <div className="relative flex-1 bg-black overflow-hidden">
        
        {/* Remote Video (Full Screen) */}
        <div 
          ref={remoteVideoRef}
          className="absolute inset-0 bg-slate-900"
        >
          {remoteUsers === 0 && !isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-400 bengali-text">পার্টনারের অপেক্ষায়...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture in Picture - Bottom Left) */}
        <div 
          ref={localVideoRef}
          className="absolute bottom-4 left-4 w-24 h-32 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/50 shadow-lg z-10"
        >
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <User className="w-8 h-8 text-slate-500" />
            </div>
          )}
        </div>

        {/* Loading State */}
        {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-20">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1CB0F6] to-[#1899D6] flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                <User className="w-12 h-12 text-white" />
              </div>
              <p className="text-lg font-semibold text-white bengali-text mb-1">কানেক্ট হচ্ছে...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 z-20">
            <div className="text-center p-6 max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-red-200 bengali-text mb-4">{error}</p>
              <button 
                onClick={handleLeave}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                ফিরে যান
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls - Bottom Bar */}
      <div className="flex items-center justify-center gap-4 py-4 px-6 bg-gradient-to-t from-[#0d47a1] to-[#1565c0]">
        {/* Camera Switch */}
        <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
          <Camera className="w-5 h-5 text-white" />
        </button>

        {/* Flip Camera */}
        <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
          <RefreshCw className="w-5 h-5 text-white" />
        </button>

        {/* Mute Mic */}
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Share Screen */}
        <button className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
          <Share2 className="w-5 h-5 text-white" />
        </button>

        {/* End Call - Red Button (Larger) */}
        <button
          onClick={handleLeave}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}

export default AgoraVideoCall
