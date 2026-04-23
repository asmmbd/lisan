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

const levelAccentStyles: Record<QuizLevel, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  intermediate: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  advanced: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

export default function PracticeQuizPage() {
  const router = useRouter()
  const { t, textClass, formatNumber } = useLanguage()
  const { fetchUserData, fetchVocabularyForApp, isLoading, vocabulary, quizState, startQuiz } = useAppStore()

  useEffect(() => {
    fetchUserData()
    fetchVocabularyForApp()
  }, [fetchUserData, fetchVocabularyForApp])

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
    <div className="mx-auto max-w-4xl w-full px-4 py-6 md:px-6">
      <div className="mb-6">
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm md:px-5">
          <button
            onClick={() => router.push('/practice')}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className={textClass}>{t('quiz.backToPractice')}</span>
          </button>
          <h1 className={cn('mt-3 text-xl font-black md:text-2xl', textClass)}>{t('quiz.levelPageTitle')}</h1>
          <p className={cn('mt-2 max-w-2xl text-sm text-muted-foreground', textClass)}>
            {t('quiz.levelPageSubtitle')}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 md:max-w-md">
            {(['beginner', 'intermediate', 'advanced'] as QuizLevel[]).map((level) => (
              <div key={level} className="rounded-xl bg-secondary/45 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {levelsLabel(level, t)}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {formatNumber(levelCounts[level])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {levels.map((level, index) => {
          const Icon = levelIcons[level.id]
          const count = levelCounts[level.id]

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm md:p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', levelAccentStyles[level.id])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className={cn('text-base font-semibold md:text-lg', textClass)}>{level.title}</h2>
                    <p className={cn('mt-1 text-sm text-muted-foreground', textClass)}>{level.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 md:min-w-[248px]">
                  <div className="rounded-xl border border-border bg-secondary/35 px-3 py-3">
                    <p className={cn('text-xs text-muted-foreground', textClass)}>{level.details}</p>
                    <p className={cn('mt-1 text-sm font-medium', textClass)}>
                      {t('quiz.availableWords', { count: formatNumber(count) })}
                    </p>
                  </div>

                  <Button
                    onClick={() => startQuiz({ title: level.title, level: level.id })}
                    className={cn('h-11 w-full gap-2 rounded-xl md:w-auto md:px-6', textClass)}
                    disabled={count === 0}
                    variant={count === 0 ? 'outline' : 'default'}
                  >
                    <Play className="h-4 w-4" />
                    {t('quiz.startLevelQuiz')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function levelsLabel(level: QuizLevel, t: (key: string, variables?: Record<string, string | number>) => string) {
  if (level === 'beginner') return t('quiz.beginnerTitle')
  if (level === 'intermediate') return t('quiz.intermediateTitle')
  return t('quiz.advancedTitle')
}
