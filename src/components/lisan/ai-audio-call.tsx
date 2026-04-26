'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { PhoneOff, Volume2, VolumeX, Bot, Clock, AlertCircle } from 'lucide-react'

type Phase = 'idle' | 'calling' | 'active' | 'listening' | 'processing' | 'speaking' | 'ended'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const ARABIC_TUTOR_PROMPT = `أنت معلم عربي ودود يساعد الطلاب على ممارسة اللغة العربية.
قواعدك:
- تحدث فقط بالعربية الفصحى السهلة
- أجب بجملة أو جملتين فقط (قصير جداً)
- شجع الطالب دائماً
- عندما يرتكب خطأ، صححه بلطف
- استخدم كلمات بسيطة
- كن صبوراً ومتشجعاً
- إذا طلب الطالب الترجمة، أعطها باللغة البنغالية بين قوسين`

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-6">
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-current"
          animate={active ? { height: ['4px', `${10 + (i % 3) * 8}px`, '4px'] } : { height: '4px' }}
          transition={{ duration: 0.45 + i * 0.05, repeat: Infinity, delay: i * 0.06 }}
        />
      ))}
    </div>
  )
}

export function AIAudioCall() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [liveText, setLiveText] = useState('')
  const [aiText, setAiText] = useState('')
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [browserSupported, setBrowserSupported] = useState(true)
  const [hasStarted, setHasStarted] = useState(false)

  const router = useRouter()

  const synthRef = useRef<SpeechSynthesis | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Refs to avoid stale closures
  const phaseRef = useRef<Phase>('idle')
  const isMutedRef = useRef(false)
  const isAiSpeakingRef = useRef(false)
  const messagesRef = useRef<Message[]>([])
  const capturedTextRef = useRef('') // text captured in current recognition session

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])
  useEffect(() => { isAiSpeakingRef.current = isAiSpeaking }, [isAiSpeaking])
  useEffect(() => { messagesRef.current = messages }, [messages])

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const active = ['active', 'listening', 'speaking', 'processing'].includes(phase)
    if (active) {
      timerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  // ── Core: speak, listen, submit — stored in refs ───────────────────────────
  const startListeningRef = useRef<() => void>(() => {})
  const submitRef = useRef<(text: string) => void>(() => {})
  const speakRef = useRef<(text: string) => void>(() => {})

  // ── speak ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    speakRef.current = (text: string) => {
      const synth = synthRef.current
      if (!synth) return

      synth.cancel()

      if (isMutedRef.current) {
        isAiSpeakingRef.current = false
        setIsAiSpeaking(false)
        setPhaseSync('active')
        // Small delay so state settles before listening
        restartTimerRef.current = setTimeout(() => startListeningRef.current(), 300)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ar-SA'
      utterance.rate = 0.85
      utterance.pitch = 1

      const voices = synth.getVoices()
      const arabicVoice =
        voices.find(v => v.lang === 'ar-SA' && v.localService) ||
        voices.find(v => v.lang === 'ar-SA') ||
        voices.find(v => v.lang.startsWith('ar'))
      if (arabicVoice) utterance.voice = arabicVoice

      utterance.onstart = () => {
        isAiSpeakingRef.current = true
        setIsAiSpeaking(true)
        setPhaseSync('speaking')
      }

      const onDone = () => {
        isAiSpeakingRef.current = false
        setIsAiSpeaking(false)
        setPhaseSync('active')
        restartTimerRef.current = setTimeout(() => startListeningRef.current(), 400)
      }

      utterance.onend = onDone
      utterance.onerror = onDone

      synth.speak(utterance)
    }
  })

  // ── submit ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    submitRef.current = async (text: string) => {
      if (!text.trim()) {
        restartTimerRef.current = setTimeout(() => startListeningRef.current(), 300)
        return
      }

      setLiveText('')
      setPhaseSync('processing')

      try {
        const res = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              ...messagesRef.current.map(m => ({ role: m.role, content: m.content })),
              { role: 'user', content: text },
            ],
            system: ARABIC_TUTOR_PROMPT,
          }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const aiResponse: string = data.content || 'عذراً، حدث خطأ.'

        const newMsgs: Message[] = [
          ...messagesRef.current,
          { role: 'user', content: text, timestamp: Date.now() },
          { role: 'assistant', content: aiResponse, timestamp: Date.now() },
        ]
        messagesRef.current = newMsgs
        setMessages(newMsgs)
        setAiText(aiResponse)

        speakRef.current(aiResponse)
      } catch (err) {
        console.error('API error:', err)
        setError('সার্ভার সমস্যা। আবার চেষ্টা করুন।')
        setPhaseSync('active')
        restartTimerRef.current = setTimeout(() => startListeningRef.current(), 500)
      }
    }
  })

  // ── startListening ───────────────────────────────────────────────────────────
  useEffect(() => {
    startListeningRef.current = () => {
      if (isAiSpeakingRef.current) return
      if (phaseRef.current === 'ended' || phaseRef.current === 'processing') return
      if (typeof window === 'undefined') return

      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) return

      const recognition = new SR()
      // continuous: false → Chrome auto-stops after user pauses → fires onend
      recognition.lang = 'ar-SA'
      recognition.continuous = false
      recognition.interimResults = true

      capturedTextRef.current = ''

      recognition.onstart = () => {
        setPhaseSync('listening')
        setLiveText('')
      }

      recognition.onresult = (event: any) => {
        let finalText = ''
        let interimText = ''

        for (let i = 0; i < event.results.length; i++) {
          const t = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalText += t
          } else {
            interimText += t
          }
        }

        if (finalText) capturedTextRef.current = finalText
        setLiveText(finalText || interimText)
      }

      // onend fires automatically after user stops speaking (continuous=false)
      recognition.onend = () => {
        if (isAiSpeakingRef.current) return
        if (phaseRef.current === 'ended') return

        const captured = capturedTextRef.current.trim()
        if (captured) {
          // Submit what we got
          submitRef.current(captured)
        } else {
          // Nothing captured, listen again
          if (phaseRef.current !== 'processing') {
            setPhaseSync('active')
            restartTimerRef.current = setTimeout(() => startListeningRef.current(), 300)
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.error('SR error:', event.error)
        if (event.error === 'not-allowed') {
          setError('মাইক্রোফোন পারমিশন দিন।')
          return
        }
        if (event.error === 'no-speech') {
          // Normal — just restart quietly
          if (!isAiSpeakingRef.current && phaseRef.current !== 'ended') {
            restartTimerRef.current = setTimeout(() => startListeningRef.current(), 300)
          }
          return
        }
        if (!isAiSpeakingRef.current && phaseRef.current !== 'ended') {
          restartTimerRef.current = setTimeout(() => startListeningRef.current(), 600)
        }
      }

      try {
        recognition.start()
      } catch (e) {
        console.error('SR start failed:', e)
        restartTimerRef.current = setTimeout(() => startListeningRef.current(), 800)
      }
    }
  })

  // ── Browser init & greeting ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hasSR = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    const hasSS = 'speechSynthesis' in window

    if (!hasSR || !hasSS) {
      setTimeout(() => setBrowserSupported(false), 0)
      return
    }

    synthRef.current = window.speechSynthesis
    // Pre-load voices
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()

    const t = setTimeout(() => {
      setHasStarted(true)
      setPhaseSync('calling')
      setMessages([])
      messagesRef.current = []
      setLiveText('')
      setCallDuration(0)
      setError(null)

      setTimeout(() => {
        const greeting = 'مرحباً! أنا معلمك العربي. كيف حالك اليوم؟'
        const initMsg: Message = { role: 'assistant', content: greeting, timestamp: Date.now() }
        messagesRef.current = [initMsg]
        setMessages([initMsg])
        setAiText(greeting)
        setPhaseSync('active')
        speakRef.current(greeting)
      }, 1500)
    }, 500)

    return () => {
      clearTimeout(t)
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    }
  }, [])

  // ── End call ────────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    if (synthRef.current) synthRef.current.cancel()
    setPhaseSync('ended')
    setTimeout(() => router.push('/practice'), 1500)
  }, [router])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      isMutedRef.current = !prev
      if (!prev && synthRef.current) synthRef.current.cancel()
      return !prev
    })
  }, [])

  const statusLabel = () => {
    if (phase === 'listening')  return 'শোনা হচ্ছে...'
    if (phase === 'processing') return 'ভাবছে...'
    if (phase === 'speaking')   return 'AI বলছে...'
    if (phase === 'calling')    return 'কানেক্ট হচ্ছে...'
    return 'কথা বলুন'
  }

  const renderWaveform = (active: boolean) => (
    <div className="flex items-end gap-[3px] h-6">
      {[...Array(7)].map((_, i) => (
        <motion.div key={i} className="w-[3px] rounded-full bg-current"
          animate={active ? { height: ['4px', `${10 + (i % 3) * 8}px`, '4px'] } : { height: '4px' }}
          transition={{ duration: 0.45 + i * 0.05, repeat: Infinity, delay: i * 0.06 }} />
      ))}
    </div>
  )

  // ── Renders ──────────────────────────────────────────────────────────────────

  if (!browserSupported) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a1a12] p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">ব্রাউজার সাপোর্ট নেই</p>
          <p className="text-white/60 text-sm">Chrome বা Edge ব্যবহার করুন</p>
        </div>
      </div>
    )
  }

  if (!hasStarted || phase === 'calling') {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-[#0F9D58] to-[#0A7A43] flex flex-col items-center justify-center">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/30">
            <Bot className="w-16 h-16 text-white" />
          </div>
          <motion.div className="absolute inset-0 rounded-full border-4 border-white/30"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">AI Tutor</h2>
        <p className="text-white/70 text-lg">কানেক্ট হচ্ছে...</p>
        <div className="flex gap-2 mt-4">
          {[0, 0.2, 0.4].map((d, i) => (
            <motion.div key={i} className="w-3 h-3 rounded-full bg-white"
              animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'ended') {
    return (
      <div className="h-screen w-full bg-gradient-to-b from-[#0F9D58] to-[#0A7A43] flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <PhoneOff className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">কল শেষ</h2>
        <p className="text-white/70 mb-6">প্র্যাক্টিস পেজে ফিরে যাওয়া হচ্ছে...</p>
        <button onClick={() => router.push('/practice')}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors">
          প্র্যাক্টিসে যান
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-gradient-to-b from-[#0F9D58] to-[#0A7A43] flex flex-col select-none">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">AI Arabic Tutor</p>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                phase === 'listening'  ? 'bg-red-400 animate-pulse' :
                phase === 'speaking'   ? 'bg-yellow-400 animate-pulse' :
                phase === 'processing' ? 'bg-blue-400 animate-pulse' :
                'bg-green-400'
              }`} />
              <p className="text-white/70 text-xs">{statusLabel()}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-white/80 bg-white/10 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-sm font-mono">{formatTime(callDuration)}</span>
        </div>
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-6">
          {phase === 'speaking' && (
            <>
              <motion.div className="absolute inset-0 rounded-full border-4 border-yellow-300/40"
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }} />
              <motion.div className="absolute inset-0 rounded-full border-4 border-yellow-300/20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />
            </>
          )}
          {phase === 'listening' && (
            <motion.div className="absolute inset-0 rounded-full border-4 border-red-400/50"
              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 0.8, repeat: Infinity }} />
          )}
          <div className="w-36 h-36 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/30">
            <Bot style={{ width: 72, height: 72 }} className="text-white" />
          </div>
        </div>

        <div className={`mb-5 ${
          phase === 'listening' ? 'text-red-300' :
          phase === 'speaking'  ? 'text-yellow-300' : 'text-white/20'
        }`}>
          {renderWaveform(phase === 'listening' || phase === 'speaking')}
        </div>

        <AnimatePresence mode="wait">
          {liveText && phase === 'listening' && (
            <motion.div key="live"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="w-full max-w-sm bg-white/10 rounded-2xl px-5 py-3 text-center mb-3">
              <p className="text-white/90 text-base leading-relaxed" dir="rtl">{liveText}</p>
            </motion.div>
          )}

          {isAiSpeaking && aiText && (
            <motion.div key="ai"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="w-full max-w-sm bg-white/20 rounded-2xl px-5 py-3 text-center mb-3">
              <p className="text-white text-base leading-relaxed" dir="rtl">{aiText}</p>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="proc"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex gap-2 mb-3">
              {[0, 0.15, 0.3].map((d, i) => (
                <motion.div key={i} className="w-3 h-3 rounded-full bg-white"
                  animate={{ y: [0, -8, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: d }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'active' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-white/40 text-sm mt-2 text-center">
            সরাসরি কথা বলুন — বাটন লাগবে না
          </motion.p>
        )}
      </div>

      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-xl text-center">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-8 py-8 px-4">
        <button onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
          }`}>
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>

        <button onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg">
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  )
}

export default AIAudioCall
