'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Bookmark, BookmarkCheck, Volume2, ChevronLeft, ChevronRight, User, Bell, Trophy } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

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
      {/* Header Skeleton */}
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

      {/* Categories Skeleton */}
      <div className="px-4 md:px-0">
        <Skeleton className="h-4 w-20 mb-4" />
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Vocabulary Sets Skeleton */}
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

      {/* Daily Word & Stats Skeleton */}
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
  const { savedWordIds, toggleSaveWord, vocabulary, categories, vocabularySets, startQuiz, isLoading } = useAppStore()
  const [dailyIndex, setDailyIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const user = session?.user

  // Show first 3 categories by default if not loaded
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

  // Auto-rotate daily word
  useEffect(() => {
    const interval = setInterval(nextDaily, 8000)
    return () => clearInterval(interval)
  }, [nextDaily])

  const dailyWords = vocabulary.slice(0, 5)
  const currentDaily = dailyWords[dailyIndex]
  const isSaved = currentDaily ? savedWordIds.includes(currentDaily.id) : false

  // Show skeleton while loading (after all hooks)
  if (isLoading || (categories.length === 0 && vocabulary.length === 0)) {
    return <HomeSkeleton />
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-4 pt-4 md:pt-8"
    >
      {/* Header - Optimized for Desktop */}
      <motion.div variants={item} className="flex items-center justify-between px-4 pb-4 md:px-0">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-3xl font-black text-foreground bengali-text">আসসালামু আলাইকুম</h1>
          <p className="text-xs md:text-sm text-muted-foreground bengali-text mt-1">আজ আপনার পড়াশোনা কেমন চলছে?</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-secondary transition-all shadow-sm">
            <Bell className="w-5 h-5 text-card-foreground" />
          </button>
          <div className="hidden md:flex flex-col items-end mr-1">
            <p className="text-xs font-bold text-foreground">{user?.name || 'ব্যবহারকারী'}</p>
            <p className="text-[10px] text-muted-foreground font-medium">পয়েন্ট: ৪৫০০</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center overflow-hidden shadow-sm">
            {user?.image ? (
              <Image src={user.image} alt={user.name || ''} width={48} height={48} />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Categories */}
      <motion.div variants={item} className="px-4 mt-6 md:px-0">
        <h2 className="text-sm font-bold text-muted-foreground mb-4 bengali-text tracking-wide uppercase">বিভাগসমূহ</h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {topCategories.map((cat) => {
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startQuiz({ category: cat.slug, title: cat.title })}
                className={`group relative overflow-hidden bg-gradient-to-br ${cat.gradient || 'from-primary to-primary/80'} rounded-xl p-4 text-white text-center shadow-md hover:shadow-xl transition-all duration-300`}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-3xl mb-2 block transform transition-transform group-hover:scale-110">{cat.icon}</span>
                <span className="text-xs font-bold leading-tight block bengali-text">{cat.title}</span>
                <Badge variant="secondary" className="mt-1.5 bg-white/20 text-white border-0 text-[9px] px-1.5 py-0">
                  {vocabulary.filter(v => v.categorySlug === cat.slug).length} শব্দ
                </Badge>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Vocabulary Sets */}
      <motion.div variants={item} className="mt-8 md:px-0 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-muted-foreground bengali-text tracking-wide uppercase">শব্দ সেট</h2>
          <button
            onClick={() => router.push('/dictionary')}
            className="text-xs text-primary font-medium bengali-text"
          >
            সব দেখুন
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
              <h3 className="text-sm font-bold bengali-text text-card-foreground line-clamp-1">{set.title}</h3>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground bengali-text">০/{set.total} শিখেছেন</span>
                  <span className="text-[10px] text-primary font-bold">০%</span>
                </div>
                <Progress value={0} className="h-1.5 bg-secondary" />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Daily Word & Stats - Re-aligned for Desktop */}
      <div className="flex flex-col lg:flex-row gap-6 mt-10 md:px-0">
        {/* Daily 5 Words */}
        <motion.div variants={item} className="flex-1 px-4 lg:px-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground bengali-text">আজকের ৫ শব্দ</h2>
          <div className="flex items-center gap-1">
            {dailyWords.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setDailyIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === dailyIndex ? 'w-4 bg-primary' : 'bg-muted-foreground/30'
                  }`}
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
            {/* Arabic word section */}
            <div className="gradient-islamic p-6 text-center relative">
              <button
                onClick={() => isSaved ? null : toggleSaveWord(currentDaily.id)}
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
              <p className="text-white/80 text-sm bengali-text">{currentDaily.pronunciation}</p>
            </div>

            {/* Meaning and example */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <div>
                  <p className="text-lg font-semibold bengali-text">{currentDaily.bengali}</p>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 mt-3">
                <p className="arabic-text text-base text-foreground mb-1">{currentDaily.example}</p>
                <p className="text-xs text-muted-foreground bengali-text">{currentDaily.exampleTranslation}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-5 pb-4">
              <Button variant="ghost" size="sm" onClick={prevDaily} className="gap-1">
                <ChevronLeft className="w-4 h-4" />
                <span className="bengali-text text-xs">পূর্ববর্তী</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => toggleSaveWord(currentDaily.id)}>
                <Volume2 className="w-4 h-4" />
                <span className="bengali-text text-xs">উচ্চারণ শুনুন</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={nextDaily} className="gap-1">
                <span className="bengali-text text-xs">পরবর্তী</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
        </motion.div>

        {/* Quick stats - Moved here for large screens */}
        <motion.div variants={item} className="flex-1 max-w-full lg:max-w-md px-4 lg:px-0">
          <div className="h-full bg-gradient-to-br from-card to-card/50 rounded-xl border border-border p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full" />
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-primary/5 rounded-full" />
            
            <div>
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-6 bengali-text text-center lg:text-left">আপনার অগ্রগতি</h3>
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
                <div className="flex flex-col lg:flex-row items-center lg:justify-between p-4 rounded-xl bg-primary/5 border border-primary/10 transition-transform hover:scale-105">
                  <p className="text-[9px] font-bold text-muted-foreground bengali-text uppercase lg:mb-0 mb-1">শব্দ শিখেছেন</p>
                  <p className="text-2xl font-black text-primary leading-none">২৮</p>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:justify-between p-4 rounded-xl bg-islamic-gold/5 border border-islamic-gold/10 transition-transform hover:scale-105">
                  <p className="text-[9px] font-bold text-muted-foreground bengali-text uppercase lg:mb-0 mb-1">আজ শিখেছেন</p>
                  <p className="text-2xl font-black text-islamic-gold leading-none">৫</p>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:justify-between p-4 rounded-xl bg-secondary border border-border transition-transform hover:scale-105">
                  <p className="text-[9px] font-bold text-muted-foreground bengali-text uppercase lg:mb-0 mb-1">দিনের স্ট্রিক</p>
                  <p className="text-2xl font-black text-foreground leading-none">৩</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center lg:justify-start gap-2 py-3 px-6 bg-primary/10 rounded-lg w-full lg:w-fit cursor-pointer hover:bg-primary/20 transition-all group">
              <Trophy className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold text-primary bengali-text capitalize tracking-wide">লিডারবোর্ড দেখুন</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
