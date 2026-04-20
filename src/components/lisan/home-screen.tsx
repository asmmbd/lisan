'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
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

export function HomeScreen() {
  const router = useRouter()
  const { data: session } = useSession()
  const { savedWordIds, toggleSaveWord, vocabulary, categories, vocabularySets, startQuiz } = useAppStore()
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

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-4"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
            <Image src="/lisan-logo.png" alt="Lisan Logo" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground bengali-text">লিসান</h1>
            <p className="text-xs text-muted-foreground bengali-text">আরবি শিখুন, কুরআন বুঝুন</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
            <Bell className="w-5 h-5 text-secondary-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center overflow-hidden">
            {user?.image ? (
              <Image src={user.image} alt={user.name || ''} width={40} height={40} />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Categories */}
      <motion.div variants={item} className="px-4 mt-4">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 bengali-text">বিভাগসমূহ</h2>
        <div className="grid grid-cols-3 gap-3">
          {topCategories.map((cat) => {
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startQuiz({ category: cat.slug, title: cat.title })}
                className={`group relative overflow-hidden bg-gradient-to-br ${cat.gradient || 'from-primary to-primary/80'} rounded-2xl p-4 text-white text-center shadow-md hover:shadow-xl transition-all duration-300`}
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

      {/* Vocabulary Sets - Horizontal Scroll */}
      <motion.div variants={item} className="mt-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground bengali-text">শব্দ সেট</h2>
          <button
            onClick={() => router.push('/dictionary')}
            className="text-xs text-primary font-medium bengali-text"
          >
            সব দেখুন
          </button>
        </div>
        <div ref={scrollRef} className="flex gap-3 px-4 overflow-x-auto hide-scrollbar pb-2">
          {vocabularySets.map((set) => (
            <motion.button
              key={set.id}
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startQuiz({ setId: set.id, title: set.title })}
              className="flex-shrink-0 w-44 bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-all text-left group"
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

      {/* Daily 5 Words */}
      <motion.div variants={item} className="mt-6 px-4">
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
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
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

      {/* Quick stats */}
      <motion.div variants={item} className="mt-6 px-4">
        <div className="bg-gradient-to-br from-card to-card/50 rounded-3xl border border-border p-5 shadow-lg relative overflow-hidden">
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/5 rounded-full" />
          <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 bengali-text text-center">আপনার অগ্রগতি</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-3 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-2xl font-black text-primary leading-none mb-1">২৮</p>
              <p className="text-[9px] font-bold text-muted-foreground bengali-text uppercase">শব্দ শিখেছেন</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-islamic-gold/5 border border-islamic-gold/10">
              <p className="text-2xl font-black text-islamic-gold leading-none mb-1">৫</p>
              <p className="text-[9px] font-bold text-muted-foreground bengali-text uppercase">আজ শিখেছেন</p>
            </div>
            <div className="flex flex-col items-center p-3 rounded-2xl bg-secondary border border-border">
              <p className="text-2xl font-black text-foreground leading-none mb-1">৩</p>
              <p className="text-[9px] font-bold text-muted-foreground bengali-text uppercase">দিনের স্ট্রিক</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 rounded-full w-fit mx-auto cursor-pointer hover:bg-primary/20 transition-colors">
            <Trophy className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-primary bengali-text capitalize tracking-wide">লিডারবোর্ড দেখুন</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
