'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { BottomNav } from '@/components/lisan/bottom-nav'
import { Onboarding } from '@/components/lisan/onboarding'
import { HomeScreen } from '@/components/lisan/home-screen'
import { DictionaryScreen } from '@/components/lisan/dictionary-screen'
import { PracticeScreen } from '@/components/lisan/practice-screen'
import { SavedScreen } from '@/components/lisan/saved-screen'
import { ProfileScreen } from '@/components/lisan/profile-screen'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(id)
  }, [])
  return mounted
}

export default function Home() {
  const { activeTab, showOnboarding, setShowOnboarding } = useAppStore()
  const mounted = useMounted()

  const handleOnboardingCheck = useCallback(() => {
    const hasSeenOnboarding = localStorage.getItem('lisan_onboarding_seen')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [setShowOnboarding])

  useEffect(() => {
    handleOnboardingCheck()
  }, [handleOnboardingCheck])

  const handleOnboardingComplete = () => {
    localStorage.setItem('lisan_onboarding_seen', 'true')
    setShowOnboarding(false)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-xl gradient-islamic flex items-center justify-center animate-pulse">
          <span className="text-white text-xl font-bold">ل</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto relative">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="min-h-[calc(100vh-4rem)]"
          >
            {activeTab === 'home' && <HomeScreen />}
            {activeTab === 'dictionary' && <DictionaryScreen />}
            {activeTab === 'practice' && <PracticeScreen />}
            {activeTab === 'saved' && <SavedScreen />}
            {activeTab === 'profile' && <ProfileScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      </AnimatePresence>
    </div>
  )
}
