'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home } from 'lucide-react'
import { ConfettiCelebration } from './confetti'

export function QuizView() {
  const { 
    quizQuestions, 
    quizCurrentIndex, 
    quizScore, 
    quizState, 
    quizSettings,
    submitAnswer, 
    resetQuiz,
    setActiveTab,
    studiedToday,
    updateStreak 
  } = useAppStore()

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const currentQuestion = quizQuestions[quizCurrentIndex]
  const progress = ((quizCurrentIndex + 1) / quizQuestions.length) * 100

  // Update streak when quiz is completed
  useEffect(() => {
    if (quizState === 'completed' && !studiedToday) {
      // Calculate XP based on score (10 XP per correct answer, min 10 XP)
      const xpEarned = Math.max(10, quizScore * 10)
      updateStreak(xpEarned)
    }
  }, [quizState, studiedToday, updateStreak, quizScore])

  const handleOptionClick = (option: string) => {
    if (isAnswered) return
    
    const correct = option === currentQuestion.correctAnswer
    setSelectedOption(option)
    setIsCorrect(correct)
    setIsAnswered(true)
    
    // Auto-advance after 1.5 seconds if you want, or require clicking Next
  }

  const handleNext = () => {
    submitAnswer(isCorrect)
    setSelectedOption(null)
    setIsAnswered(false)
  }

  if (quizState === 'completed') {
    const perfectScore = quizScore === quizQuestions.length
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-6 text-center"
      >
        {perfectScore && <ConfettiCelebration />}
        
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <span className="text-5xl">{perfectScore ? '🏆' : '👏'}</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 bengali-text">কুইজ সম্পন্ন!</h2>
        <p className="text-muted-foreground mb-6 bengali-text">
          আপনি {quizQuestions.length} এর মধ্যে {quizScore} পেয়েছেন
        </p>
        
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <Button 
            onClick={() => {
                const settings = quizSettings || {}
                resetQuiz()
                // Should restart with original settings
            }} 
            variant="outline" 
            className="rounded-xl gap-2 bengali-text"
          >
            <RotateCcw className="w-4 h-4" /> পুনরায় খেলুন
          </Button>
          <Button 
            onClick={() => {
              resetQuiz()
              setActiveTab('home')
            }} 
            className="rounded-xl gap-2 bengali-text"
          >
            <Home className="w-4 h-4" /> হোম
          </Button>
        </div>
      </motion.div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="flex flex-col h-full bg-background p-4 pt-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {quizSettings?.title || 'Vocabulary Quiz'}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {quizCurrentIndex + 1} / {quizQuestions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      {/* Question */}
      <motion.div 
        key={quizCurrentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex-1 flex flex-col pt-4"
      >
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 gradient-islamic" />
          <p className="text-xs text-muted-foreground mb-4 bengali-text uppercase tracking-widest">এই শব্দটির অর্থ কী?</p>
          <h2 className="arabic-text text-5xl font-bold text-foreground mb-2">
            {currentQuestion.arabic}
          </h2>
          <p className="text-primary italic font-medium">{currentQuestion.pronunciation}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option: string) => {
            const isSelected = selectedOption === option
            const isCorrectOption = isAnswered && option === currentQuestion.correctAnswer
            const isWrongSelection = isAnswered && isSelected && !isCorrect
            
            let btnClass = "h-16 text-lg justify-start px-6 rounded-xl border-2 transition-all duration-200 "
            if (!isAnswered) {
              btnClass += "border-border hover:border-primary hover:bg-primary/5 active:scale-95"
            } else if (isCorrectOption) {
              btnClass += "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            } else if (isWrongSelection) {
              btnClass += "border-destructive bg-destructive/5 text-destructive"
            } else {
              btnClass += "border-border opacity-50"
            }

            return (
              <motion.button
                key={option}
                disabled={isAnswered}
                onClick={() => handleOptionClick(option)}
                className={btnClass}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="bengali-text font-medium">{option}</span>
                  {isAnswered && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {isAnswered && isWrongSelection && <XCircle className="w-5 h-5 text-destructive" />}
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-8 pb-4">
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className={`p-4 rounded-xl mb-4 flex items-center justify-between ${
                isCorrect 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-destructive/10 border border-destructive/20 text-destructive'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCorrect ? 'bg-emerald-500' : 'bg-destructive'
                  }`}>
                    {isCorrect ? <CheckCircle2 className="text-white w-6 h-6" /> : <XCircle className="text-white w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold bengali-text">{isCorrect ? 'চমৎকার!' : 'ভুল উত্তর'}</p>
                    <p className="text-xs opacity-90 bengali-text">
                      {isCorrect ? 'আপনার উত্তরটি সঠিক হয়েছে' : `সঠিক উত্তর ছিল: ${currentQuestion.correctAnswer}`}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleNext}
                  className={`${isCorrect ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-destructive hover:bg-destructive/90'} text-white rounded-xl px-6 h-12 shadow-lg`}
                >
                  <span className="bengali-text mr-2">পরবর্তী</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isAnswered && (
          <p className="text-center text-xs text-muted-foreground bengali-text">
            সঠিক উত্তরটি বেছে নিন
          </p>
        )}
      </div>
    </div>
  )
}
