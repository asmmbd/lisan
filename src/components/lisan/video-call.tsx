'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoCallProps {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isConnected: boolean
  isConnecting: boolean
  callTimer: number
  partnerName: string
  onEndCall: () => void
  onToggleMute: () => boolean
  onToggleVideo: () => boolean
}

export function VideoCall({
  localStream,
  remoteStream,
  isConnected,
  isConnecting,
  callTimer,
  partnerName,
  onEndCall,
  onToggleMute,
  onToggleVideo,
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)

  // Connect local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Connect remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const handleToggleMute = () => {
    const enabled = onToggleMute()
    setIsMuted(!enabled)
  }

  const handleToggleVideo = () => {
    const enabled = onToggleVideo()
    setIsCameraOff(!enabled)
  }

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Partner video area */}
      <div className="relative flex-1 bg-black rounded-2xl overflow-hidden mb-3 min-h-[280px]">
        {/* Remote video (full screen) */}
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Placeholder when no remote video */
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-card to-secondary/30">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full gradient-islamic flex items-center justify-center mx-auto mb-3 shadow-lg animate-pulse">
                <span className="text-4xl text-white font-bold">
                  {partnerName.charAt(0) || 'ع'}
                </span>
              </div>
              <p className="text-sm font-medium bengali-text">{partnerName}</p>
              <p className="text-xs text-muted-foreground">
                {isConnecting ? 'কানেক্ট হচ্ছে...' : 'পার্টনার'}
              </p>
            </div>
          </div>
        )}

        {/* Self video (small - picture in picture) */}
        <div className="absolute top-3 right-3 w-32 h-44 rounded-xl bg-black/50 border border-white/20 flex items-center justify-center overflow-hidden shadow-lg">
          {localStream && !isCameraOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <VideoOff className="w-8 h-8 text-white/60 mb-2" />
              <span className="text-xs text-white/60">ক্যামেরা বন্ধ</span>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-white" />
          <span className="text-white text-xs font-mono">{formatTime(callTimer)}</span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />
          )}
        </div>

        {/* Connection status */}
        {isConnecting && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
            <span className="text-white text-sm">কানেক্ট হচ্ছে...</span>
          </div>
        )}

        {/* Conversation hint */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm rounded-xl p-3">
          <p className="text-xs text-white/90 bengali-text">
            💡 বিষয়: দৈনন্দিন জীবন - সকালের রুটিন সম্পর্কে কথা বলুন
          </p>
        </div>
      </div>

      {/* Call controls */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={handleToggleMute}
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
          onClick={handleToggleVideo}
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
          onClick={onEndCall}
          className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  )
}

export default VideoCall
