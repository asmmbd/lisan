'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface WebRTCState {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

interface UseWebRTCReturn extends WebRTCState {
  startCall: (targetUserId: string) => Promise<void>
  acceptCall: (offer: RTCSessionDescriptionInit, callerId: string) => Promise<void>
  endCall: () => void
  toggleMute: () => boolean
  toggleVideo: () => boolean
  peerConnection: RTCPeerConnection | null
  setRemoteStream: (stream: MediaStream) => void
}

// Free STUN servers from Google
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
}

export function useWebRTC(socket: any, currentUserId: string): UseWebRTCReturn {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  })

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // Initialize local media stream
  const initializeMedia = useCallback(async (audioOnly = false) => {
    try {
      // Try video + audio first
      if (!audioOnly) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          })
          localStreamRef.current = stream
          setState(prev => ({ ...prev, localStream: stream, error: null }))
          console.log('Camera and microphone accessed successfully')
          return stream
        } catch (videoErr) {
          console.warn('Video access failed, trying audio only:', videoErr)
          // Fall through to audio-only mode
        }
      }

      // Audio-only fallback
      const audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      })
      localStreamRef.current = audioStream
      setState(prev => ({ 
        ...prev, 
        localStream: audioStream, 
        error: audioOnly ? null : 'Camera not available, using audio only' 
      }))
      console.log('Audio-only mode activated')
      return audioStream
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Media initialization failed:', errorMessage)
      
      // Check for specific error types
      if (errorMessage.includes('NotFoundError') || errorMessage.includes('Requested device not found')) {
        setState(prev => ({ 
          ...prev, 
          error: 'ক্যামেরা/মাইক্রোফোন পাওয়া যায়নি। দয়া করে ডিভাইস কানেক্ট করুন বা পারমিশন দিন।' 
        }))
      } else if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
        setState(prev => ({ 
          ...prev, 
          error: 'ক্যামেরা/মাইক্রোফোন পারমিশন দিন। ব্রাউজার সেটিংস থেকে অনুমতি দিন।' 
        }))
      } else {
        setState(prev => ({ 
          ...prev, 
          error: `Media access error: ${errorMessage}` 
        }))
      }
      throw err
    }
  }, [])

  // Create peer connection
  const createPeerConnection = useCallback((targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    peerConnectionRef.current = pc

    // Add local stream tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      setState(prev => ({ ...prev, remoteStream, isConnected: true, isConnecting: false }))
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          targetUserId,
        })
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall()
      }
    }

    return pc
  }, [socket])

  // Start a call (Caller side)
  const startCall = useCallback(async (targetUserId: string) => {
    console.log('startCall initiated, target:', targetUserId, 'socket:', socket?.id)
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }))
      
      await initializeMedia()
      console.log('Media initialized, creating peer connection')
      const pc = createPeerConnection(targetUserId)

      // Create offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      console.log('Offer created, emitting call-offer to:', targetUserId)

      // Send offer through signaling server
      if (socket) {
        socket.emit('call-offer', {
          offer,
          targetUserId,
          callerId: currentUserId,
        })
        console.log('call-offer emitted successfully')
      } else {
        console.error('Socket is null, cannot emit call-offer')
      }
    } catch (err) {
      console.error('Error in startCall:', err)
      setState(prev => ({ ...prev, error: 'Failed to start call', isConnecting: false }))
    }
  }, [socket, currentUserId, initializeMedia, createPeerConnection])

  // Accept a call (Callee side)
  const acceptCall = useCallback(async (offer: RTCSessionDescriptionInit, callerId: string) => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }))
      
      await initializeMedia()
      const pc = createPeerConnection(callerId)

      // Set remote description (offer)
      await pc.setRemoteDescription(offer)

      // Create answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Send answer through signaling server
      socket?.emit('call-answer', {
        answer,
        callerId,
      })
    } catch (err) {
      setState(prev => ({ ...prev, error: 'Failed to accept call', isConnecting: false }))
    }
  }, [socket, initializeMedia, createPeerConnection])

  // Handle incoming answer
  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    const pc = peerConnectionRef.current
    if (pc) {
      await pc.setRemoteDescription(answer)
    }
  }, [])

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current
    if (pc) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }, [])

  // End call
  const endCall = useCallback(() => {
    // Stop all tracks
    localStreamRef.current?.getTracks().forEach(track => track.stop())
    
    // Close peer connection
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    localStreamRef.current = null

    setState({
      localStream: null,
      remoteStream: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    })

    socket?.emit('call-ended', { callerId: currentUserId })
  }, [socket, currentUserId])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      return audioTrack.enabled
    }
    return false
  }, [])

  // Toggle video
  const toggleVideo = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      return videoTrack.enabled
    }
    return false
  }, [])

  // Listen for signaling events
  useEffect(() => {
    if (!socket) return

    socket.on('call-answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)

    return () => {
      socket.off('call-answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
    }
  }, [socket, handleAnswer, handleIceCandidate])

  return {
    ...state,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    peerConnection: peerConnectionRef.current,
    setRemoteStream: (stream: MediaStream) => setState(prev => ({ ...prev, remoteStream: stream })),
  }
}

export default useWebRTC
