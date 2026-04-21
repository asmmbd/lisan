'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Sparkles, Layers3, Trophy, Play } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { QuizView } from '@/components/lisan/quiz-view'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/components/lisan/language-provider'
import { getVocabularyLevel, type QuizLevel } from '@/lib/quiz'

const levelIcons: Record<QuizLevel, typeof Sparkles> = {
  beginner: Sparkles,
  intermediate: Layers3,
  advanced: Trophy,
}

const levelColors: Record<QuizLevel, string> = {
  beginner: 'from-emerald-500 to-teal-600',
  intermediate: 'from-amber-500 to-orange-500',
  advanced: 'from-rose-500 to-red-600',
}

export default function PracticeQuizPage() {
  const router = useRouter()
  const { t, textClass, formatNumber } = useLanguage()
  const { fetchUserData, isLoading, vocabulary, quizState, startQuiz } = useAppStore()

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  if (quizState !== 'idle') {
    return <QuizView />
  }

  if (isLoading || vocabulary.length === 0) {
    return (
      <div className="mx-auto max-w-5xl w-full px-4 py-6 md:px-6">
        <div className="space-y-3 mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-72 rounded-3xl" />
          ))}
        </div>
      </div>
    )
  }

  const levelCounts = vocabulary.reduce<Record<QuizLevel, number>>((acc, word) => {
    const level = getVocabularyLevel(word)
    acc[level] += 1
    return acc
  }, {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  })

  const levels: Array<{
    id: QuizLevel
    title: string
    description: string
    details: string
  }> = [
    {
      id: 'beginner',
      title: t('quiz.beginnerTitle'),
      description: t('quiz.beginnerDescription'),
      details: t('quiz.beginnerDetails'),
    },
    {
      id: 'intermediate',
      title: t('quiz.intermediateTitle'),
      description: t('quiz.intermediateDescription'),
      details: t('quiz.intermediateDetails'),
    },
    {
      id: 'advanced',
      title: t('quiz.advancedTitle'),
      description: t('quiz.advancedDescription'),
      details: t('quiz.advancedDetails'),
    },
  ]

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-6 md:px-6">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => router.push('/practice')}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className={textClass}>{t('quiz.backToPractice')}</span>
          </button>
          <h1 className={cn('text-2xl md:text-4xl font-black', textClass)}>{t('quiz.levelPageTitle')}</h1>
          <p className={cn('text-sm md:text-base text-muted-foreground mt-2 max-w-2xl', textClass)}>
            {t('quiz.levelPageSubtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {levels.map((level, index) => {
          const Icon = levelIcons[level.id]
          const count = levelCounts[level.id]

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden"
            >
              <div className={cn('p-6 bg-gradient-to-br text-white', levelColors[level.id])}>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className={cn('text-2xl font-black', textClass)}>{level.title}</h2>
                <p className={cn('text-white/85 mt-2 text-sm', textClass)}>{level.description}</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <p className={cn('text-sm text-muted-foreground', textClass)}>{level.details}</p>
                  <div className="rounded-2xl bg-secondary/60 border border-border px-4 py-3">
                    <p className={cn('text-sm font-medium', textClass)}>
                      {t('quiz.availableWords', { count: formatNumber(count) })}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => startQuiz({ title: level.title, level: level.id })}
                  className={cn('w-full rounded-2xl h-12 text-base gap-2', textClass)}
                  disabled={count === 0}
                >
                  <Play className="w-4 h-4" />
                  {t('quiz.startLevelQuiz')}
                </Button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
