'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Home, ChevronLeft, X } from 'lucide-react'
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
  const questionTextClass = currentQuestion?.direction === 'ar_to_bn'
    ? 'arabic-text text-4xl md:text-5xl'
    : cn('text-2xl md:text-3xl', textClass)
  const optionTextClass = currentQuestion?.direction === 'bn_to_ar'
    ? 'arabic-text text-lg md:text-xl'
    : cn('font-medium', textClass)

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

  const handleCloseQuiz = () => {
    setSelectedOption(null)
    setIsAnswered(false)
    setIsCorrect(false)
    resetQuiz()
  }

  if (quizState === 'completed') {
    const perfectScore = quizScore === quizQuestions.length

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-2xl p-4 md:p-6"
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-5">
            <button
              onClick={handleCloseQuiz}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className={textClass}>{t('quiz.back')}</span>
            </button>
            <button
              onClick={handleCloseQuiz}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/70"
              aria-label={t('quiz.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center p-6 text-center md:p-8">
            {perfectScore && <ConfettiCelebration />}

            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-9 w-9 text-primary" />
            </div>

            <h2 className={cn('mb-2 text-xl font-bold', textClass)}>{t('quiz.completed')}</h2>
            <p className={cn('mb-6 text-sm text-muted-foreground', textClass)}>
              {t('quiz.scoreText', { total: formatNumber(quizQuestions.length), score: formatNumber(quizScore) })}
            </p>

            <div className="grid w-full max-w-sm grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  const settings = quizSettings || {}
                  resetQuiz()
                  startQuiz(settings)
                }}
                variant="outline"
                className={cn('h-11 gap-2 rounded-xl', textClass)}
              >
                <RotateCcw className="h-4 w-4" />
                {t('quiz.playAgain')}
              </Button>
              <Button
                onClick={handleCloseQuiz}
                className={cn('h-11 gap-2 rounded-xl', textClass)}
              >
                <Home className="h-4 w-4" />
                {t('quiz.home')}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="mx-auto w-full max-w-2xl p-4 md:p-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-5">
          <button
            onClick={handleCloseQuiz}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className={textClass}>{t('quiz.back')}</span>
          </button>
          <button
            onClick={handleCloseQuiz}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary/70"
            aria-label={t('quiz.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 md:p-5">
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className={cn('text-xs font-semibold uppercase tracking-wider text-primary', textClass)}>
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-1 flex-col pt-1"
          >
            <div className="mb-5 rounded-2xl border border-border bg-background px-5 py-6 text-center md:px-6 md:py-7">
              <p className={cn('mb-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground', textClass)}>
                {t(currentQuestion.promptText || 'quiz.questionTitle')}
              </p>
              <h2 className={cn('mb-2 font-bold text-foreground', questionTextClass)}>
                {currentQuestion.questionText}
              </h2>
              {currentQuestion.helperText && (
                <p className="text-sm font-medium text-primary">{currentQuestion.helperText}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option: string) => {
                const isSelected = selectedOption === option
                const isCorrectOption = isAnswered && option === currentQuestion.correctAnswer
                const isWrongSelection = isAnswered && isSelected && !isCorrect

                let btnClass = 'min-h-14 rounded-xl border px-4 py-4 text-left text-base transition-colors duration-200 '
                if (!isAnswered) {
                  btnClass += 'border-border bg-background hover:border-primary/40 hover:bg-secondary/40'
                } else if (isCorrectOption) {
                  btnClass += 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                } else if (isWrongSelection) {
                  btnClass += 'border-destructive/40 bg-destructive/10 text-destructive'
                } else {
                  btnClass += 'border-border bg-background opacity-55'
                }

                return (
                  <motion.button
                    key={option}
                    disabled={isAnswered}
                    onClick={() => handleOptionClick(option)}
                    className={btnClass}
                    whileTap={!isAnswered ? { scale: 0.99 } : {}}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className={optionTextClass}>{option}</span>
                      {isAnswered && isCorrectOption && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                      {isAnswered && isWrongSelection && <XCircle className="h-5 w-5 shrink-0 text-destructive" />}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          <div className="mt-5">
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className={`mb-2 flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${
                    isCorrect
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-destructive/20 bg-destructive/10 text-destructive'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isCorrect ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-destructive/15 text-destructive'
                      }`}>
                        {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
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
                      className={`${isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-destructive hover:bg-destructive/90'} h-11 rounded-xl px-6 text-white shadow-none`}
                    >
                      <span className={cn('mr-2', textClass)}>{t('common.next')}</span>
                      <ArrowRight className="h-4 w-4" />
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
      </div>
    </div>
  )
}
