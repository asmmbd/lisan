'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Bookmark, BookmarkCheck, Volume2, ChevronLeft, ChevronRight, User, Bell, Trophy, Flame } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLanguage } from './language-provider'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function HomeSkeleton() {
  return (
    <div className="pb-4 pt-4 md:pt-8 space-y-6">
      <div className="flex items-center justify-between px-4 pb-4 md:px-0">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
          <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-xl" />
        </div>
      </div>
      <div className="px-4 md:px-0">
        <Skeleton className="h-4 w-20 mb-4" />
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="px-4 md:px-0">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-44 md:w-full rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
      <div className="flex flex-col lg:flex-row gap-6 px-4 lg:px-0">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <div className="flex-1 max-w-full lg:max-w-md">
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function HomeScreen() {
  const router = useRouter()
  const { data: session } = useSession()
  const { t, textClass, formatNumber } = useLanguage()
  const {
    savedWordIds,
    toggleSaveWord,
    vocabulary,
    categories,
    vocabularySets,
    startQuiz,
    isLoading,
    streak,
    totalXP,
    studiedToday,
    fetchStreak,
    fetchVocabularyForApp,
  } = useAppStore()

  const [dailyIndex, setDailyIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const user = session?.user

  const topCategories = categories.length > 0 ? categories.slice(0, 3) : []

  const nextDaily = useCallback(() => {
    if (vocabulary.length === 0) return
    setDailyIndex((prev) => (prev + 1) % Math.min(vocabulary.length, 5))
  }, [vocabulary.length])

  const prevDaily = useCallback(() => {
    if (vocabulary.length === 0) return
    const count = Math.min(vocabulary.length, 5)
    setDailyIndex((prev) => (prev - 1 + count) % count)
  }, [vocabulary.length])

  useEffect(() => {
    const interval = setInterval(nextDaily, 8000)
    return () => clearInterval(interval)
  }, [nextDaily])

  useEffect(() => {
    if (session?.user) {
      fetchStreak()
    }
  }, [session?.user?.id, fetchStreak])

  // Load vocabulary for home screen (daily words)
  useEffect(() => {
    fetchVocabularyForApp()
  }, [fetchVocabularyForApp])

  const dailyWords = vocabulary.slice(0, 5)
  const currentDaily = dailyWords[dailyIndex]

  if (isLoading && categories.length === 0) {
    return <HomeSkeleton />
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-4 pt-4 md:pt-8"
    >
      <motion.div variants={item} className="flex items-center justify-between px-4 pb-4 md:px-0">
        <div className="flex flex-col">
          <h1 className={cn('text-xl md:text-3xl font-black text-foreground', textClass)}>{t('home.greeting')}</h1>
          <p className={cn('text-xs md:text-sm text-muted-foreground mt-1', textClass)}>{t('home.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {streak > 0 && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${studiedToday ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-secondary/50 border border-border'}`}>
              <Flame className={`w-4 h-4 ${studiedToday ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-bold ${studiedToday ? 'text-orange-600' : 'text-muted-foreground'}`}>{formatNumber(streak)}</span>
            </div>
          )}
          <button className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-secondary transition-all shadow-sm">
            <Bell className="w-5 h-5 text-card-foreground" />
          </button>
          <div className="hidden md:flex flex-col items-end mr-1">
            <p className={cn('text-xs font-bold text-foreground', textClass)}>{user?.name || t('common.unknownUser')}</p>
            <p className={cn('text-[10px] text-muted-foreground font-medium', textClass)}>
              {t('common.points')}: {formatNumber(totalXP)}
            </p>
          </div>
          <Avatar className="w-10 h-10 rounded-xl border border-primary/20 bg-primary/10 shadow-sm">
            {user?.image ? <AvatarImage src={user.image} alt={user.name || ''} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.charAt(0) || <User className="w-5 h-5 text-primary" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </motion.div>

      <motion.div variants={item} className="px-4 mt-6 md:px-0">
        <h2 className={cn('text-sm font-bold text-muted-foreground mb-4 tracking-wide uppercase', textClass)}>{t('home.categories')}</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {topCategories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startQuiz({ category: cat.slug, title: cat.title })}
              className={`group relative overflow-hidden bg-gradient-to-br ${cat.gradient || 'from-primary to-primary/80'} rounded-xl p-4 text-white text-center shadow-md hover:shadow-xl transition-all duration-300`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-3xl mb-2 block transform transition-transform group-hover:scale-110">{cat.icon}</span>
              <span className={cn('text-xs font-bold leading-tight block', textClass)}>{cat.title}</span>
              <Badge variant="secondary" className="mt-1.5 bg-white/20 text-white border-0 text-[9px] px-1.5 py-0">
                {formatNumber((cat as any).wordCount ?? vocabulary.filter((v: any) => v.categorySlug === cat.slug).length)} {t('home.words')}
              </Badge>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="mt-8 md:px-0 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn('text-sm font-bold text-muted-foreground tracking-wide uppercase', textClass)}>{t('home.sets')}</h2>
          <button
            onClick={() => router.push('/dictionary')}
            className={cn('text-xs text-primary font-medium', textClass)}
          >
            {t('home.seeAll')}
          </button>
        </div>
        <div ref={scrollRef} className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto hide-scrollbar pb-4 md:pb-0">
          {vocabularySets.map((set) => (
            <motion.button
              key={set.id}
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startQuiz({ setId: set.id, title: set.title })}
              className="flex-shrink-0 w-44 md:w-full bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
                <span className="text-2xl">{set.icon}</span>
              </div>
              <h3 className={cn('text-sm font-bold text-card-foreground line-clamp-1', textClass)}>{set.title}</h3>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-[10px] text-muted-foreground', textClass)}>{formatNumber(0)}/{formatNumber(set.total)} {t('home.learned')}</span>
                  <span className="text-[10px] text-primary font-bold">{formatNumber(0)}%</span>
                </div>
                <Progress value={0} className="h-1.5 bg-secondary" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6 mt-10 md:px-0">
        <motion.div variants={item} className="flex-1 px-4 lg:px-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className={cn('text-sm font-semibold text-muted-foreground', textClass)}>{t('home.dailyWords')}</h2>
            <div className="flex items-center gap-1">
              {dailyWords.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setDailyIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === dailyIndex ? 'w-4 bg-primary' : 'bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>

          {currentDaily && (
            <motion.div
              key={dailyIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
            >
              <div className="gradient-islamic p-6 text-center relative">
                <button
                  onClick={() => toggleSaveWord(currentDaily.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  {savedWordIds.includes(currentDaily.id) ? (
                    <BookmarkCheck className="w-4 h-4 text-white" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-white" />
                  )}
                </button>
                <p className="arabic-text text-4xl text-white font-bold mb-1">
                  {currentDaily.arabic}
                </p>
                <p className={cn('text-white/80 text-sm', textClass)}>{currentDaily.pronunciation}</p>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <div>
                    <p className={cn('text-lg font-semibold', textClass)}>{currentDaily.bengali}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 mt-3">
                  <p className="arabic-text text-base text-foreground mb-1">{currentDaily.example}</p>
                  <p className={cn('text-xs text-muted-foreground', textClass)}>{currentDaily.exampleTranslation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-5 pb-4">
                <Button variant="ghost" size="sm" onClick={prevDaily} className="gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  <span className={cn('text-xs', textClass)}>{t('common.previous')}</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => toggleSaveWord(currentDaily.id)}>
                  <Volume2 className="w-4 h-4" />
                  <span className={cn('text-xs', textClass)}>{t('common.listen')}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={nextDaily} className="gap-1">
                  <span className={cn('text-xs', textClass)}>{t('common.next')}</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={item} className="flex-1 max-w-full lg:max-w-md px-4 lg:px-0">
          <div className="h-full bg-gradient-to-br from-card to-card/50 rounded-xl border border-border p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full" />
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-primary/5 rounded-full" />

            <div>
              <h3 className={cn('text-xs font-bold text-primary uppercase tracking-widest mb-6 text-center lg:text-left', textClass)}>{t('home.progress')}</h3>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                <div className="flex flex-col lg:flex-row items-center lg:justify-between p-4 rounded-xl bg-primary/5 border border-primary/10 transition-transform hover:scale-105">
                  <p className={cn('text-[9px] font-bold text-muted-foreground uppercase lg:mb-0 mb-1', textClass)}>{t('profile.wordsLearned')}</p>
                  <p className="text-2xl font-black text-primary leading-none">{formatNumber(savedWordIds.length)}</p>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:justify-between p-4 rounded-xl bg-islamic-gold/5 border border-islamic-gold/10 transition-transform hover:scale-105">
                  <p className={cn('text-[9px] font-bold text-muted-foreground uppercase lg:mb-0 mb-1', textClass)}>{t('home.totalXp')}</p>
                  <p className="text-2xl font-black text-islamic-gold leading-none">{formatNumber(totalXP)}</p>
                </div>
                <div className={`flex flex-col lg:flex-row items-center lg:justify-between p-4 rounded-xl border transition-transform hover:scale-105 ${streak > 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-secondary border-border'}`}>
                  <p className={cn('text-[9px] font-bold text-muted-foreground uppercase lg:mb-0 mb-1', textClass)}>{t('home.streak')}</p>
                  <div className="flex items-center gap-1">
                    {streak > 0 && <Flame className="w-4 h-4 text-orange-500" />}
                    <p className={`text-2xl font-black leading-none ${streak > 0 ? 'text-orange-500' : 'text-foreground'}`}>{formatNumber(streak)}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/leaderboard')}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-6 py-3 transition-all hover:bg-primary/20 lg:w-fit lg:justify-start group"
            >
              <Trophy className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
              <span className={cn('text-xs font-bold text-primary capitalize tracking-wide', textClass)}>{t('home.leaderboard')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
