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
  const [conversationMode, setConversationMode] = useState<ConversationMode>('general')
  const [showHints, setShowHints] = useState(true)
  const [showTranslation, setShowTranslation] = useState(false)

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
      <div className="min-h-[400px] bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center">
        <div className="text-center w-full max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2 bengali-text">AI সাথে প্র্যাকটিস করুন</h3>
          <p className="text-muted-foreground mb-6">
            আরবিতে কথা বলুন, AI আপনাকে সংশোধন করবে
          </p>

          {/* Mode Selection */}
          <div className="mb-6">
            <p className="text-sm mb-3 bengali-text text-muted-foreground">কথোপকথনের ধরন:</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(MODES) as ConversationMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setConversationMode(mode)}
                  className={`p-3 rounded-xl text-sm transition-all ${
                    conversationMode === mode
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {MODES[mode].label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startCall}
            className="w-full px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all bengali-text flex items-center justify-center gap-2"
          >
            <Mic className="w-5 h-5" />
            কল শুরু করুন
          </button>
        </div>
      </div>
    )
  }

  // Calling state
  if (phase === 'calling') {
    return (
      <div className="min-h-[400px] bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Bot className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <p className="bengali-text text-lg">কানেক্ট হচ্ছে...</p>
        <p className="text-muted-foreground text-sm mt-2">AI Tutor</p>
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

  // Active call UI
  return (
    <div className="min-h-[500px] bg-card rounded-xl border border-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">AI Tutor</p>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${phase === 'active' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                <p className="text-muted-foreground text-xs">
                  {phase === 'active' ? 'শোনার অপেক্ষায়' : phase === 'processing' ? 'ভাবছে...' : 'বলছে...'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPhase('idle')
                setMessages([])
                setCallDuration(0)
              }}
              className="p-2 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
              title="নতুন কল"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatTime(callDuration)}</span>
            </div>
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={endCall}
              className="p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(Object.keys(MODES) as ConversationMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setConversationMode(mode)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                conversationMode === mode
                  ? 'bg-primary text-primary-foreground font-bold'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {MODES[mode].label}
            </button>
          ))}
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
                msg.role === 'user' ? 'bg-primary/10' : 'bg-primary'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-primary" />
                ) : (
                  <Bot className="w-4 h-4 text-primary-foreground" />
                )}
              </div>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-muted text-foreground rounded-tl-none'
                  : 'bg-primary text-primary-foreground rounded-tr-none'
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
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="max-w-[80%] p-3 rounded-2xl bg-muted/50 text-muted-foreground rounded-tl-none border border-border">
              <p className="text-sm">
                {transcript}
                <span className="text-muted-foreground/50">{interimTranscript}</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* AI Processing indicator */}
        {phase === 'processing' && (
          <div className="flex gap-2 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="p-3 rounded-2xl bg-primary rounded-tr-none">
              <div className="flex gap-1">
                <motion.div className="w-2 h-2 bg-primary-foreground rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
                <motion.div className="w-2 h-2 bg-primary-foreground rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} />
                <motion.div className="w-2 h-2 bg-primary-foreground rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-red-500 text-sm bengali-text text-center">{error}</p>
        </div>
      )}

      {/* Push to Talk Button */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-col items-center gap-3">
          {/* Status text */}
          <p className="text-muted-foreground text-xs bengali-text">
            {isRecording ? 'শোনা হচ্ছে...' : isAiSpeaking ? 'AI বলছে...' : 'বলতে চাপুন ধরে রাখুন'}
          </p>

          <div className="flex items-center gap-4">
            {/* Cancel AI speech button */}
            {isAiSpeaking && (
              <button
                onClick={stopAiSpeech}
                className="p-3 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
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
                  ? 'bg-red-500 text-white'
                  : phase === 'active' && !isAiSpeaking
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isRecording ? (
                renderWaveform()
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </motion.button>

            {/* Phrase Helper */}
            <button
              onClick={() => setShowHints(!showHints)}
              className="p-3 bg-muted text-muted-foreground rounded-full hover:bg-muted/80 transition-colors"
              title="সাহায্য"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs bengali-text"
            >
              🔴 রেকর্ডিং...
            </motion.p>
          )}

          {/* Quick Phrases */}
          {showHints && phase === 'active' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-muted rounded-xl p-3"
            >
              <p className="text-muted-foreground text-xs font-bold mb-2">দ্রুত বাক্য:</p>
              <div className="flex flex-wrap gap-2">
                {conversationMode === 'greetings' && [
                  { ar: 'مرحباً', bn: 'আসসালামু আলাইকুম' },
                  { ar: 'كيف حالك؟', bn: 'আপনি কেমন আছেন?' },
                  { ar: 'أنا بخير', bn: 'আমি ভালো আছি' },
                  { ar: 'شكراً', bn: 'ধন্যবাদ' },
                ].map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(phrase.ar)
                      callClaude(phrase.ar)
                    }}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs hover:bg-muted transition-colors"
                  >
                    {phrase.ar}
                  </button>
                ))}
                {conversationMode === 'numbers' && [
                  { ar: 'واحد', bn: 'এক' },
                  { ar: 'اثنان', bn: 'দুই' },
                  { ar: 'ثلاثة', bn: 'তিন' },
                  { ar: 'أربعة', bn: 'চার' },
                ].map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(phrase.ar)
                      callClaude(phrase.ar)
                    }}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs hover:bg-muted transition-colors"
                  >
                    {phrase.ar}
                  </button>
                ))}
                {conversationMode === 'daily' && [
                  { ar: 'صباح الخير', bn: 'শুভ সকাল' },
                  { ar: 'مساء الخير', bn: 'শুভ সন্ধ্যা' },
                  { ar: 'أنا جائع', bn: 'আমি ক্ষুধার্থ' },
                  { ar: 'أريد أن آكل', bn: 'আমি খেতে চাই' },
                ].map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(phrase.ar)
                      callClaude(phrase.ar)
                    }}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs hover:bg-muted transition-colors"
                  >
                    {phrase.ar}
                  </button>
                ))}
                {conversationMode === 'general' && [
                  { ar: 'ما اسمك؟', bn: 'আপনার নাম কী?' },
                  { ar: 'أين تعيش؟', bn: 'আপনি কোথায় থাকেন?' },
                  { ar: 'أحب العربية', bn: 'আমি আরবি ভালোবাসি' },
                  { ar: 'ساعدني', bn: 'আমাকে সাহায্য করুন' },
                ].map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(phrase.ar)
                      callClaude(phrase.ar)
                    }}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs hover:bg-muted transition-colors"
                  >
                    {phrase.ar}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIAudioCall
