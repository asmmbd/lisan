'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, PhoneOff, Volume2, VolumeX, Bot, User, Clock, AlertCircle, RotateCcw, Sparkles, BookOpen } from 'lucide-react'

// Phase types
type Phase = 'idle' | 'calling' | 'active' | 'processing' | 'speaking' | 'ended'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type ConversationMode = 'general' | 'greetings' | 'numbers' | 'daily'

const MODES: Record<ConversationMode, { label: string; prompt: string }> = {
  general: {
    label: 'সাধারণ কথোপকথন',
    prompt: 'أنت معلم عربي ودود يساعد الطلاب على ممارسة اللغة العربية في محادثات عامة. تحدث عن الحياة اليومية، الأصدقاء، الأسرة، والاهتمامات.'
  },
  greetings: {
    label: 'সালাম ও অভিবাদন',
    prompt: 'أنت معلم عربي يركز على تعليم التحيات والتعارف. علم الطالب كيف يقول مرحباً، كيف حالك، أنا بخير، وشكراً.'
  },
  numbers: {
    label: 'সংখ্যা ও গণনা',
    prompt: 'أنت معلم عربي يركز على تعليم الأرقام. استخدم الأرقام في المحادثات، وساعد الطالب على عد الأشياء.'
  },
  daily: {
    label: 'দৈনন্দিন জীবন',
    prompt: 'أنت معلم عربي يساعد على ممارسة اللغة في سياق الحياة اليومية - الصباح، الطعام، العمل، المدرسة، والنوم.'
  }
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
- إذا طلب الطالب الترجمة، أعطها باللغة البنغالية بين قوسين

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
  const conversationMode = 'general' // Fixed mode, no selection
  const [showHints, setShowHints] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Check browser support and auto-start
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    const hasSpeechSynthesis = 'speechSynthesis' in window

    if (!hasSpeechRecognition || !hasSpeechSynthesis) {
      setBrowserSupported(false)
      setError('আপনার ব্রাউজারে voice recognition সাপোর্ট নেই। Chrome বা Edge ব্যবহার করুন।')
      return
    }

    // Auto-start the call after a brief delay
    const timer = setTimeout(() => {
      setHasStarted(true)
      startCall()
    }, 500)

    return () => clearTimeout(timer)
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

      const modePrompt = MODES[conversationMode].prompt
      const fullSystemPrompt = `${ARABIC_TUTOR_PROMPT}\n\n${modePrompt}`

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
          system: fullSystemPrompt,
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
  }, [messages, speak, conversationMode])

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
      <div className="h-screen flex items-center justify-center bg-[#0a1a12] p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white bengali-text text-lg mb-2">ব্রাউজার সাপোর্ট নেই</p>
          <p className="text-white/60 text-sm bengali-text">Chrome বা Edge ব্যবহার করুন</p>
        </div>
      </div>
    )
  }

  // Initial loading/connecting state
  if (!hasStarted || phase === 'calling') {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-[#1a237e] to-[#0d47a1] flex flex-col items-center justify-center">
        {/* AI Avatar */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/30">
            <Bot className="w-16 h-16 text-white" />
          </div>
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-white/30"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">AI Tutor</h2>
        <p className="text-white/70 text-lg">কানেক্ট হচ্ছে...</p>
        
        {/* Animated dots */}
        <div className="flex gap-2 mt-4">
          <motion.div
            className="w-3 h-3 rounded-full bg-white"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-white"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-white"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    )
  }

  // Ended state
  if (phase === 'ended') {
    return (
      <div className="min-h-[400px] bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center">
        <p className="bengali-text text-xl mb-2">কল শেষ</p>
        <p className="text-muted-foreground text-sm">ধন্যবাদ!</p>
      </div>
    )
  }

  // Active call UI - Modern fullscreen style like video call
  return (
    <div className="h-screen w-full bg-gradient-to-b from-[#1a237e] to-[#0d47a1] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0d47a1]/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm text-white">AI Tutor</p>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${phase === 'active' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
              <p className="text-white/70 text-xs">
                {phase === 'active' ? 'শোনার অপেক্ষায়' : phase === 'processing' ? 'ভাবছে...' : 'বলছে...'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Timer */}
        <div className="flex items-center gap-1.5 text-white/80 bg-white/10 px-3 py-1.5 rounded-full">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatTime(callDuration)}</span>
        </div>
      </div>

      {/* Main Content Area - Centered Avatar */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Large AI Avatar */}
        <div className="relative mb-8">
          <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/30">
            <Bot className="w-20 h-20 text-white" />
          </div>
          {phase === 'speaking' && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-green-400/50"
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {/* Status Text */}
        <h2 className="text-xl font-semibold text-white mb-2">
          {phase === 'active' && !isAiSpeaking && !isRecording ? 'শোনার অপেক্ষায়' : ''}
          {isRecording ? 'শোনা হচ্ছে...' : ''}
          {isAiSpeaking ? 'AI বলছে...' : ''}
          {phase === 'processing' ? 'ভাবছে...' : ''}
        </h2>

        {/* Live Transcript (when user is speaking) */}
        {(interimTranscript || transcript) && phase === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-6 py-3 bg-white/10 rounded-2xl max-w-md text-center"
          >
            <p className="text-white/90 text-lg" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {transcript}
              <span className="text-white/50">{interimTranscript}</span>
            </p>
          </motion.div>
        )}

        {/* AI Message (when AI is speaking) */}
        {isAiSpeaking && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 px-6 py-3 bg-primary/20 rounded-2xl max-w-md text-center"
          >
            <p className="text-white text-lg" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {messages[messages.length - 1]?.content}
            </p>
          </motion.div>
        )}

        {/* AI Processing */}
        {phase === 'processing' && (
          <div className="mt-4 flex gap-2">
            <motion.div className="w-3 h-3 rounded-full bg-white" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
            <motion.div className="w-3 h-3 rounded-full bg-white" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
            <motion.div className="w-3 h-3 rounded-full bg-white" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
          </div>
        )}
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-xl text-center">
          <p className="text-sm bengali-text">{error}</p>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="flex items-center justify-center gap-6 py-6 px-4 bg-gradient-to-t from-[#0d47a1] to-transparent">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>

        {/* Main PTT Button (Large) */}
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
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isRecording
              ? 'bg-red-500 text-white'
              : phase === 'active' && !isAiSpeaking
              ? 'bg-white text-[#1a237e]'
              : 'bg-white/30 text-white/50 cursor-not-allowed'
          }`}
        >
          {isRecording ? (
            renderWaveform()
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </motion.button>

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

export default AIAudioCall
