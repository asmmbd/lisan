'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'

interface UseAgoraReturn {
  localVideoRef: React.RefObject<HTMLDivElement | null>
  remoteVideoRef: React.RefObject<HTMLDivElement | null>
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  remoteUsers: IAgoraRTCRemoteUser[]
  joinChannel: (appId: string, channel: string, token: string, uid: string) => Promise<void>
  leaveChannel: () => void
  toggleMute: () => void
  toggleVideo: () => void
  isMuted: boolean
  isCameraOff: boolean
}

export function useAgora(): UseAgoraReturn {
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const localVideoRef = useRef<HTMLDivElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)

  // Initialize Agora client
  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
    clientRef.current = client

    // Handle remote users
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType)
      console.log('Remote user published:', user.uid, mediaType)
      
      if (mediaType === 'video') {
        user.videoTrack?.play(remoteVideoRef.current!)
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play()
      }
      
      setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user])
    })

    client.on('user-unpublished', (user, mediaType) => {
      console.log('Remote user unpublished:', user.uid, mediaType)
      if (mediaType === 'video') {
        user.videoTrack?.stop()
      }
      if (mediaType === 'audio') {
        user.audioTrack?.stop()
      }
    })

    client.on('user-left', (user) => {
      console.log('Remote user left:', user.uid)
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
    })

    return () => {
      leaveChannel()
    }
  }, [])

  const joinChannel = useCallback(async (appId: string, channel: string, token: string, uid: string) => {
    try {
      setIsConnecting(true)
      setError(null)
      
      const client = clientRef.current
      if (!client) throw new Error('Client not initialized')

      // Join the channel
      await client.join(appId, channel, token, uid)
      console.log('✅ Joined channel:', channel)

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      localAudioTrackRef.current = audioTrack
      localVideoTrackRef.current = videoTrack

      // Play local video
      videoTrack.play(localVideoRef.current!)
      
      // Publish tracks
      await client.publish([audioTrack, videoTrack])
      console.log('✅ Published local tracks')

      setIsConnected(true)
      setIsConnecting(false)
      
    } catch (err: any) {
      console.error('❌ Failed to join:', err)
      setError(err.message || 'কলে যোগ দিতে ব্যর্থ')
      setIsConnecting(false)
    }
  }, [])

  const leaveChannel = useCallback(() => {
    const client = clientRef.current
    
    // Stop and close local tracks
    localAudioTrackRef.current?.stop()
    localAudioTrackRef.current?.close()
    localVideoTrackRef.current?.stop()
    localVideoTrackRef.current?.close()
    
    localAudioTrackRef.current = null
    localVideoTrackRef.current = null
    
    // Leave channel
    client?.leave().then(() => {
      console.log('👋 Left channel')
    }).catch((err) => {
      console.log('Leave error:', err)
    })
    
    setIsConnected(false)
    setRemoteUsers([])
    setIsMuted(false)
    setIsCameraOff(false)
  }, [])

  const toggleMute = useCallback(() => {
    const audioTrack = localAudioTrackRef.current
    if (audioTrack) {
      const newState = !isMuted
      audioTrack.setEnabled(!newState)
      setIsMuted(newState)
      console.log(newState ? '🎤 Muted' : '🎤 Unmuted')
    }
  }, [isMuted])

  const toggleVideo = useCallback(() => {
    const videoTrack = localVideoTrackRef.current
    if (videoTrack) {
      const newState = !isCameraOff
      videoTrack.setEnabled(!newState)
      setIsCameraOff(newState)
      console.log(newState ? '📹 Camera off' : '📹 Camera on')
    }
  }, [isCameraOff])

  return {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    error,
    remoteUsers,
    joinChannel,
    leaveChannel,
    toggleMute,
    toggleVideo,
    isMuted,
    isCameraOff,
  }
}

export default useAgora
