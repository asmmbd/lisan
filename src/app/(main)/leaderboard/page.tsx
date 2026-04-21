'use client'

import { useEffect, useState } from 'react'
import { Trophy, Flame, ChevronLeft, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/components/lisan/language-provider'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type LeaderboardEntry = {
  id: string
  name: string | null
  image: string | null
  totalXP: number
  streak: number
  savedWordsCount: number
  rank: number
}

type LeaderboardResponse = {
  leaders: LeaderboardEntry[]
  currentUser: LeaderboardEntry | null
}

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-0">
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <Skeleton className="mb-4 h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { t, textClass, formatNumber } = useLanguage()
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setData(payload))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <LeaderboardSkeleton />
  }

  const leaders = data?.leaders || []
  const currentUser = data?.currentUser

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 md:px-0">
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className={textClass}>{t('leaderboard.backHome')}</span>
        </button>

        <div className="mt-4 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className={cn('text-xl font-black md:text-2xl', textClass)}>{t('home.leaderboard')}</h1>
            <p className={cn('mt-1 text-sm text-muted-foreground', textClass)}>{t('leaderboard.subtitle')}</p>
          </div>
        </div>
      </div>

      {currentUser ? (
        <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 shadow-sm">
          <p className={cn('mb-3 text-xs font-semibold uppercase tracking-wide text-primary', textClass)}>
            {t('leaderboard.yourPosition')}
          </p>
          <LeaderboardRow entry={currentUser} highlight textClass={textClass} formatNumber={formatNumber} t={t} />
        </div>
      ) : null}

      <div className="space-y-3">
        {leaders.map((entry) => (
          <LeaderboardRow
            key={entry.id}
            entry={entry}
            highlight={currentUser?.id === entry.id}
            textClass={textClass}
            formatNumber={formatNumber}
            t={t}
          />
        ))}
      </div>

      {leaders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <p className={cn('text-sm text-muted-foreground', textClass)}>{t('leaderboard.empty')}</p>
        </div>
      ) : null}
    </div>
  )
}

function LeaderboardRow({
  entry,
  highlight,
  textClass,
  formatNumber,
  t,
}: {
  entry: LeaderboardEntry
  highlight?: boolean
  textClass: string
  formatNumber: (value: number) => string
  t: (key: string, variables?: Record<string, string | number>) => string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm',
        highlight ? 'border-primary/20 bg-primary/5' : 'border-border'
      )}
    >
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
        entry.rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
      )}>
        {formatNumber(entry.rank)}
      </div>

      <Avatar className="h-11 w-11 shrink-0 border border-border bg-secondary">
        {entry.image ? <AvatarImage src={entry.image} alt={entry.name || ''} /> : null}
        <AvatarFallback className={cn('text-sm font-semibold', textClass)}>
          {(entry.name || t('common.unknownUser')).slice(0, 1)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold md:text-base', textClass)}>{entry.name || t('common.unknownUser')}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className={cn('inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2.5 py-1', textClass)}>
            <Trophy className="h-3.5 w-3.5" />
            {formatNumber(entry.totalXP)} {t('home.totalXp')}
          </span>
          <span className={cn('inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2.5 py-1', textClass)}>
            <Flame className="h-3.5 w-3.5" />
            {formatNumber(entry.streak)} {t('home.streak')}
          </span>
          <span className={cn('inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2.5 py-1', textClass)}>
            <Star className="h-3.5 w-3.5" />
            {formatNumber(entry.savedWordsCount)} {t('profile.wordsLearned')}
          </span>
        </div>
      </div>
    </div>
  )
}
