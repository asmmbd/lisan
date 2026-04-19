'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { PhoneOff, Mic, MicOff, Video, VideoOff, Clock, User, Users } from 'lucide-react'

interface AgoraVideoCallProps {
  appId: string
  channel: string
  token: string
  uid: string
  onLeave: () => void
  callTimer: number
}

export function AgoraVideoCall({ appId, channel, token, uid, onLeave, callTimer }: AgoraVideoCallProps) {
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

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  useEffect(() => {
    let AgoraRTC: any
    
    const initAgora = async () => {
      try {
        // Dynamic import for Agora
        const AgoraModule = await import('agora-rtc-sdk-ng')
        AgoraRTC = AgoraModule.default
        
        console.log('🎬 Initializing Agora, channel:', channel)
        
        // Create client
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
        clientRef.current = client

        // Handle remote users
        client.on('user-published', async (user: any, mediaType: string) => {
          await client.subscribe(user, mediaType)
          console.log('👤 Remote user published:', user.uid, mediaType)
          
          if (mediaType === 'video' && remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current)
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play()
          }
          
          setRemoteUsers(prev => prev + 1)
        })

        client.on('user-unpublished', (user: any, mediaType: string) => {
          console.log('👤 Remote user unpublished:', user.uid, mediaType)
          if (mediaType === 'video') {
            user.videoTrack?.stop()
          }
          if (mediaType === 'audio') {
            user.audioTrack?.stop()
          }
        })

        client.on('user-left', () => {
          console.log('👤 Remote user left')
          setRemoteUsers(prev => Math.max(0, prev - 1))
        })

        // Join channel (token can be null for testing without authentication)
        const agoraToken = token || null
        // Convert uid to number (Agora requires numeric uid)
        const numericUid = typeof uid === 'string' ? parseInt(uid.replace(/\D/g, '')) || Date.now() : uid
        
        console.log('🔑 Joining with:', { appId: appId?.slice(0, 8) + '...', channel, hasToken: !!agoraToken, uid: numericUid })
        await client.join(appId, channel, agoraToken, numericUid)
        console.log('✅ Joined channel:', channel)

        // Create local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        localAudioTrackRef.current = audioTrack
        localVideoTrackRef.current = videoTrack

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }
        
        // Publish tracks
        await client.publish([audioTrack, videoTrack])
        console.log('✅ Published local tracks')

        setIsConnected(true)
        setIsConnecting(false)
        
      } catch (err: any) {
        console.error('❌ Agora error:', err)
        setError(err.message || 'ভিডিও কল শুরু করতে ব্যর্থ')
        setIsConnecting(false)
      }
    }

    initAgora()

    return () => {
      // Cleanup
      console.log('🧹 Cleaning up Agora')
      localAudioTrackRef.current?.stop()
      localAudioTrackRef.current?.close()
      localVideoTrackRef.current?.stop()
      localVideoTrackRef.current?.close()
      
      clientRef.current?.leave().catch(() => {})
    }
  }, [appId, channel, token, uid])

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
    <div className="flex flex-col h-full pb-20">
      {/* Video Container */}
      <div className="relative flex-1 bg-black rounded-2xl overflow-hidden mb-3 min-h-[280px]">
        
        {/* Remote Video (Big) */}
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

        {/* Local Video (Small, Corner) */}
        <div 
          ref={localVideoRef}
          className="absolute top-3 right-3 w-32 h-40 bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-600 z-10"
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                <User className="w-12 h-12 text-white" />
              </div>
              <p className="text-lg font-semibold text-white bengali-text mb-1">কানেক্ট হচ্ছে...</p>
              <p className="text-sm text-slate-400">Agora Video Call</p>
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

        {/* Timer */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 z-10">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-mono">{formatTime(callTimer)}</span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          )}
        </div>

        {/* Participant count */}
        <div className="absolute bottom-16 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
          <span className="text-white text-xs">
            👥 আপনি + {remoteUsers} জন
          </span>
        </div>

        {/* Topic hint */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur-sm rounded-xl p-3 z-10">
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

export default AgoraVideoCall
