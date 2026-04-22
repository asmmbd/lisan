'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, PhoneOff, Volume2, VolumeX, Bot, User, Clock, AlertCircle } from 'lucide-react'

// Phase types
type Phase = 'idle' | 'calling' | 'active' | 'processing' | 'speaking' | 'ended'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// System prompt for Arabic tutor
const ARABIC_TUTOR_PROMPT = `أنت معلم عربي ودود يساعد الطلاب على ممارسة اللغة العربية.

قواعدك:
- تحدث فقط بالعربية الفصحى السهلة
- أجب بجملة أو جملتين فقط (قصير جداً)
- شجع الطالب دائماً
- عندما يرتكب خطأ، صححه بلطف
- استخدم كلمات بسيطة
- كن صبوراً ومتشجعاً

مثال للرد:
"أحسنت! جملتك جيدة. لكن قل 'أنا أحب' بدلاً من 'أنا حب'. حاول مرة أخرى!"`

export function AIAudioCall() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [browserSupported, setBrowserSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Check browser support
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    const hasSpeechSynthesis = 'speechSynthesis' in window

    if (!hasSpeechRecognition || !hasSpeechSynthesis) {
      setBrowserSupported(false)
      setError('আপনার ব্রাউজারে voice recognition সাপোর্ট নেই। Chrome বা Edge ব্যবহার করুন।')
    }
  }, [])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Call timer
  useEffect(() => {
    if (phase === 'active' || phase === 'speaking' || phase === 'processing') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [phase])

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [])

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return null

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null

    const recognition = new SpeechRecognition()
    recognition.lang = 'ar-SA'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim += transcript
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript)
      }
      setInterimTranscript(interim)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setError('মাইক্রোফোন এক্সেস দিন')
      }
    }

    return recognition
  }, [])

  // Speak text using TTS
  const speak = useCallback(async (text: string) => {
    if (!synthRef.current || isMuted) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ar-SA'
    utterance.rate = 0.85
    utterance.pitch = 1

    utterance.onstart = () => {
      setIsAiSpeaking(true)
      setPhase('speaking')
    }

    utterance.onend = () => {
      setIsAiSpeaking(false)
      setPhase('active')
      setTranscript('')
      setInterimTranscript('')
    }

    utterance.onerror = () => {
      setIsAiSpeaking(false)
      setPhase('active')
    }

    currentUtteranceRef.current = utterance
    synthRef.current.speak(utterance)
  }, [isMuted])

  // Stop AI speech
  const stopAiSpeech = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
    }
    setIsAiSpeaking(false)
    setPhase('active')
  }, [])

  // Call Claude API
  const callClaude = useCallback(async (userMessage: string) => {
    try {
      setPhase('processing')

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: userMessage },
          ],
          system: ARABIC_TUTOR_PROMPT,
        }),
      })

      if (!response.ok) {
        throw new Error('AI service error')
      }

      const data = await response.json()
      const aiResponse = data.content || 'عذراً، حدث خطأ. حاول مرة أخرى.'

      // Add to messages
      setMessages(prev => [
        ...prev,
        { role: 'user', content: userMessage, timestamp: Date.now() },
        { role: 'assistant', content: aiResponse, timestamp: Date.now() },
      ])

      // Speak the response
      speak(aiResponse)

    } catch (err) {
      console.error('Claude API error:', err)
      setError('AI সার্ভিসে সমস্যা। আবার চেষ্টা করুন।')
      setPhase('active')
    }
  }, [messages, speak])

  // Start call
  const startCall = useCallback(() => {
    if (!browserSupported) return
    
    setPhase('calling')
    setMessages([])
    setTranscript('')
    setInterimTranscript('')
    setCallDuration(0)
    setError(null)

    // Simulate connecting delay
    setTimeout(() => {
      setPhase('active')
      
      // AI greeting
      const greeting = 'مرحباً! أنا معلمك العربي. كيف حالك اليوم؟'
      setMessages([{ role: 'assistant', content: greeting, timestamp: Date.now() }])
      speak(greeting)
    }, 1500)
  }, [browserSupported, speak])

  // End call
  const endCall = useCallback(() => {
    // Stop recording
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    // Stop AI speech
    stopAiSpeech()
    
    setPhase('ended')
    setIsRecording(false)
    setTranscript('')
    setInterimTranscript('')

    // Reset after delay
    setTimeout(() => {
      setPhase('idle')
      setMessages([])
      setCallDuration(0)
    }, 2000)
  }, [stopAiSpeech])

  // Push to talk handlers
  const startRecording = useCallback(() => {
    if (phase !== 'active' || isAiSpeaking || !browserSupported) return

    const recognition = initRecognition()
    if (!recognition) {
      setError('Voice recognition unavailable')
      return
    }

    recognitionRef.current = recognition
    
    try {
      recognition.start()
    } catch (err) {
      console.error('Failed to start recognition:', err)
    }
  }, [phase, isAiSpeaking, browserSupported, initRecognition])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)

    // Process final transcript
    const finalText = transcript + interimTranscript
    if (finalText.trim()) {
      callClaude(finalText.trim())
    }
    
    setInterimTranscript('')
  }, [transcript, interimTranscript, callClaude])

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    startRecording()
  }, [startRecording])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    stopRecording()
  }, [stopRecording])

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
    if (!isMuted) {
      stopAiSpeech()
    }
  }, [isMuted, stopAiSpeech])

  // Render helpers
  const renderWaveform = () => (
    <div className="flex items-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-[#c9a96e] rounded-full"
          animate={{
            height: isRecording ? [8, 24, 8] : [4, 8, 4],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  )

  // UI Components
  if (!browserSupported) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-[#0a1a12] rounded-2xl p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white bengali-text text-lg mb-2">ব্রাউজার সাপোর্ট নেই</p>
          <p className="text-white/60 text-sm bengali-text">Chrome বা Edge ব্যবহার করুন</p>
        </div>
      </div>
    )
  }

  // Idle state
  if (phase === 'idle') {
    return (
      <div className="min-h-[400px] bg-gradient-to-br from-[#0a1a12] to-[#0d2418] rounded-2xl p-8 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c9a96e] to-[#a08050] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#c9a96e]/20">
            <Bot className="w-10 h-10 text-[#0a1a12]" />
          </div>
          <h3 className="text-2xl font-bold text-white bengali-text mb-2">AI সাথে প্র্যাকটিস করুন</h3>
          <p className="text-white/60 bengali-text mb-6 max-w-xs mx-auto">
            আরবিতে কথা বলুন, AI আপনাকে সংশোধন করবে
          </p>
          <button
            onClick={startCall}
            className="px-8 py-4 bg-gradient-to-r from-[#c9a96e] to-[#a08050] text-[#0a1a12] font-bold rounded-xl hover:shadow-lg hover:shadow-[#c9a96e]/30 transition-all bengali-text"
          >
            কল শুরু করুন
          </button>
        </motion.div>
      </div>
    )
  }

  // Calling state
  if (phase === 'calling') {
    return (
      <div className="min-h-[400px] bg-gradient-to-br from-[#0a1a12] to-[#0d2418] rounded-2xl p-8 flex flex-col items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-[#c9a96e]/20 flex items-center justify-center mb-6"
        >
          <div className="w-16 h-16 rounded-full bg-[#c9a96e]/40 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#c9a96e] flex items-center justify-center">
              <Bot className="w-6 h-6 text-[#0a1a12]" />
            </div>
          </div>
        </motion.div>
        <p className="text-white bengali-text text-lg">কানেক্ট হচ্ছে...</p>
        <p className="text-white/50 text-sm mt-2">AI Tutor</p>
      </div>
    )
  }

  // Ended state
  if (phase === 'ended') {
    return (
      <div className="min-h-[400px] bg-gradient-to-br from-[#0a1a12] to-[#0d2418] rounded-2xl p-8 flex flex-col items-center justify-center">
        <p className="text-white bengali-text text-xl mb-2">কল শেষ</p>
        <p className="text-white/50 text-sm">ধন্যবাদ!</p>
      </div>
    )
  }

  // Active call UI
  return (
    <div className="min-h-[500px] bg-gradient-to-br from-[#0a1a12] to-[#0d2418] rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0a1a12]/80 backdrop-blur-sm border-b border-[#c9a96e]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#c9a96e]/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#c9a96e]" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">AI Tutor</p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${phase === 'active' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
              <p className="text-white/50 text-xs">
                {phase === 'active' ? 'শোনার অপেক্ষায়' : phase === 'processing' ? 'ভাবছে...' : 'বলছে...'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#c9a96e]">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatTime(callDuration)}</span>
          </div>
          <button
            onClick={toggleMute}
            className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-[#c9a96e]/20 text-[#c9a96e]'}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={endCall}
            className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ direction: 'rtl' }}>
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-[#c9a96e]/20' : 'bg-[#c9a96e]'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-[#c9a96e]" />
                ) : (
                  <Bot className="w-4 h-4 text-[#0a1a12]" />
                )}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-[#c9a96e]/20 text-white rounded-tl-none' 
                  : 'bg-[#c9a96e] text-[#0a1a12] rounded-tr-none'
              }`}>
                <p className="text-sm leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {msg.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Live transcript */}
        {(interimTranscript || transcript) && phase === 'active' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 flex-row"
          >
            <div className="w-8 h-8 rounded-full bg-[#c9a96e]/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[#c9a96e]" />
            </div>
            <div className="max-w-[80%] p-3 rounded-2xl bg-[#c9a96e]/10 text-white/70 rounded-tl-none border border-[#c9a96e]/30">
              <p className="text-sm">
                {transcript}
                <span className="text-white/40">{interimTranscript}</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* AI Processing indicator */}
        {phase === 'processing' && (
          <div className="flex gap-2 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-[#c9a96e] flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-[#0a1a12]" />
            </div>
            <div className="p-3 rounded-2xl bg-[#c9a96e] rounded-tr-none">
              <div className="flex gap-1">
                <motion.div className="w-2 h-2 bg-[#0a1a12] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
                <motion.div className="w-2 h-2 bg-[#0a1a12] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                <motion.div className="w-2 h-2 bg-[#0a1a12] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-red-400 text-sm bengali-text text-center">{error}</p>
        </div>
      )}

      {/* Push to Talk Button */}
      <div className="p-4 bg-[#0a1a12]/80 backdrop-blur-sm border-t border-[#c9a96e]/20">
        <div className="flex flex-col items-center gap-3">
          {/* Status text */}
          <p className="text-white/60 text-xs bengali-text">
            {isRecording ? 'শোনা হচ্ছে...' : isAiSpeaking ? 'AI বলছে...' : 'বলতে চাপুন ধরে রাখুন'}
          </p>

          <div className="flex items-center gap-4">
            {/* Cancel AI speech button */}
            {isAiSpeaking && (
              <button
                onClick={stopAiSpeech}
                className="p-3 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                title="AI থামান"
              >
                <VolumeX className="w-5 h-5" />
              </button>
            )}

            {/* Main PTT Button */}
            <motion.button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={isRecording ? stopRecording : undefined}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              disabled={phase !== 'active' || isAiSpeaking}
              whileTap={{ scale: 0.95 }}
              animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500 shadow-lg shadow-red-500/30'
                  : phase === 'active' && !isAiSpeaking
                  ? 'bg-gradient-to-r from-[#c9a96e] to-[#a08050] shadow-lg shadow-[#c9a96e]/30'
                  : 'bg-[#c9a96e]/30 cursor-not-allowed'
              }`}
            >
              {isRecording ? (
                renderWaveform()
              ) : (
                <Mic className="w-8 h-8 text-[#0a1a12]" />
              )}
            </motion.button>

            {/* Placeholder for spacing */}
            {isAiSpeaking && <div className="w-12" />}
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs bengali-text"
            >
              🔴 রেকর্ডিং...
            </motion.p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIAudioCall
