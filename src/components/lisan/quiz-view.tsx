'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home } from 'lucide-react'
import { ConfettiCelebration } from './confetti'
import { cn } from '@/lib/utils'
import { useLanguage } from './language-provider'

export function QuizView() {
  const {
    quizQuestions,
    quizCurrentIndex,
    quizScore,
    quizState,
    quizSettings,
    submitAnswer,
    resetQuiz,
    studiedToday,
    updateStreak,
    startQuiz,
  } = useAppStore() as any

  const { t, textClass, formatNumber } = useLanguage()
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const currentQuestion = quizQuestions[quizCurrentIndex]
  const progress = ((quizCurrentIndex + 1) / quizQuestions.length) * 100

  useEffect(() => {
    if (quizState === 'completed' && !studiedToday) {
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

        <h2 className={cn('text-2xl font-bold mb-2', textClass)}>{t('quiz.completed')}</h2>
        <p className={cn('text-muted-foreground mb-6', textClass)}>
          {t('quiz.scoreText', { total: formatNumber(quizQuestions.length), score: formatNumber(quizScore) })}
        </p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <Button
            onClick={() => {
              const settings = quizSettings || {}
              resetQuiz()
              startQuiz(settings)
            }}
            variant="outline"
            className={cn('rounded-xl gap-2', textClass)}
          >
            <RotateCcw className="w-4 h-4" /> {t('quiz.playAgain')}
          </Button>
          <Button
            onClick={() => resetQuiz()}
            className={cn('rounded-xl gap-2', textClass)}
          >
            <Home className="w-4 h-4" /> {t('quiz.home')}
          </Button>
        </div>
      </motion.div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="flex flex-col h-full bg-background p-4 pt-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className={cn('text-xs font-semibold text-primary uppercase tracking-wider', textClass)}>
            {quizSettings?.title || t('quiz.vocabularyQuiz')}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {formatNumber(quizCurrentIndex + 1)} / {formatNumber(quizQuestions.length)}
          </span>
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      <motion.div
        key={quizCurrentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex-1 flex flex-col pt-4"
      >
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 gradient-islamic" />
          <p className={cn('text-xs text-muted-foreground mb-4 uppercase tracking-widest', textClass)}>{t('quiz.questionTitle')}</p>
          <h2 className="arabic-text text-5xl font-bold text-foreground mb-2">
            {currentQuestion.arabic}
          </h2>
          <p className="text-primary italic font-medium">{currentQuestion.pronunciation}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((option: string) => {
            const isSelected = selectedOption === option
            const isCorrectOption = isAnswered && option === currentQuestion.correctAnswer
            const isWrongSelection = isAnswered && isSelected && !isCorrect

            let btnClass = 'h-16 text-lg justify-start px-6 rounded-xl border-2 transition-all duration-200 '
            if (!isAnswered) {
              btnClass += 'border-border hover:border-primary hover:bg-primary/5 active:scale-95'
            } else if (isCorrectOption) {
              btnClass += 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
            } else if (isWrongSelection) {
              btnClass += 'border-destructive bg-destructive/5 text-destructive'
            } else {
              btnClass += 'border-border opacity-50'
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
                  <span className={cn('font-medium', textClass)}>{option}</span>
                  {isAnswered && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {isAnswered && isWrongSelection && <XCircle className="w-5 h-5 text-destructive" />}
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

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
                    <p className={cn('font-bold', textClass)}>{isCorrect ? t('quiz.great') : t('quiz.wrong')}</p>
                    <p className={cn('text-xs opacity-90', textClass)}>
                      {isCorrect ? t('quiz.answerCorrect') : t('quiz.correctAnswerWas', { answer: currentQuestion.correctAnswer })}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleNext}
                  className={`${isCorrect ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-destructive hover:bg-destructive/90'} text-white rounded-xl px-6 h-12 shadow-lg`}
                >
                  <span className={cn('mr-2', textClass)}>{t('common.next')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isAnswered && (
          <p className={cn('text-center text-xs text-muted-foreground', textClass)}>
            {t('quiz.chooseCorrect')}
          </p>
        )}
      </div>
    </div>
  )
}
