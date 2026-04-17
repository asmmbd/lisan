'use client'

import { useState, useEffect, useCallback } from 'react'
import DailyIframe, { DailyCall } from '@daily-co/daily-js'

interface UseDailyVideoReturn {
  callObject: DailyCall | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  localVideoElement: HTMLVideoElement | null
  remoteVideoElement: HTMLVideoElement | null
  joinCall: (roomUrl: string) => Promise<void>
  leaveCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
}

export function useDailyVideo(): UseDailyVideoReturn {
  const [callObject, setCallObject] = useState<DailyCall | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localVideoElement, setLocalVideoElement] = useState<HTMLVideoElement | null>(null)
  const [remoteVideoElement, setRemoteVideoElement] = useState<HTMLVideoElement | null>(null)

  const joinCall = useCallback(async (roomUrl: string) => {
    try {
      setIsConnecting(true)
      setError(null)

      const call = DailyIframe.createCallObject()
      setCallObject(call)

      call.on('joined-meeting', () => {
        setIsConnected(true)
        setIsConnecting(false)
      })

      call.on('left-meeting', () => {
        setIsConnected(false)
        setIsConnecting(false)
      })

      call.on('error', (e: any) => {
        setError(e.errorMsg || 'Call error occurred')
        setIsConnecting(false)
      })

      // Join the room
      await call.join({ url: roomUrl })

      // Set video elements
      const localEl = document.getElementById('local-video') as HTMLVideoElement
      const remoteEl = document.getElementById('remote-video') as HTMLVideoElement
      
      if (localEl) {
        call.setLocalVideo(localEl)
        setLocalVideoElement(localEl)
      }
      
      if (remoteEl) {
        // Remote video auto-handled by Daily
        setRemoteVideoElement(remoteEl)
      }

    } catch (err) {
      setError('Failed to join call')
      setIsConnecting(false)
    }
  }, [])

  const leaveCall = useCallback(() => {
    if (callObject) {
      callObject.leave()
      callObject.destroy()
      setCallObject(null)
      setIsConnected(false)
    }
  }, [callObject])

  const toggleMute = useCallback(() => {
    if (callObject) {
      const currentState = callObject.localAudio()
      callObject.setLocalAudio(!currentState)
    }
  }, [callObject])

  const toggleVideo = useCallback(() => {
    if (callObject) {
      const currentState = callObject.localVideo()
      callObject.setLocalVideo(!currentState)
    }
  }, [callObject])

  useEffect(() => {
    return () => {
      if (callObject) {
        callObject.leave()
        callObject.destroy()
      }
    }
  }, [callObject])

  return {
    callObject,
    isConnected,
    isConnecting,
    error,
    localVideoElement,
    remoteVideoElement,
    joinCall,
    leaveCall,
    toggleMute,
    toggleVideo,
  }
}

export default useDailyVideo
