'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Onboarding } from '@/components/lisan/onboarding'
import { HomeScreen } from '@/components/lisan/home-screen'

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
  const { showOnboarding, setShowOnboarding, fetchUserData } = useAppStore()
  const mounted = useMounted()

  const handleOnboardingCheck = useCallback(() => {
    const hasSeenOnboarding = localStorage.getItem('lisan_onboarding_seen')
    if (!hasSeenOnboarding) {
      setShowOnboarding(true)
    }
  }, [setShowOnboarding])

  useEffect(() => {
    handleOnboardingCheck()
    // Fetch user data on mount
    fetchUserData()
  }, [handleOnboardingCheck, fetchUserData])

  const handleOnboardingComplete = () => {
    localStorage.setItem('lisan_onboarding_seen', 'true')
    setShowOnboarding(false)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-xl gradient-islamic flex items-center justify-center animate-pulse">
          <span className="text-white text-xl font-bold">&#1604;</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      </AnimatePresence>

      {!showOnboarding && (
        <main className="overflow-y-auto custom-scrollbar">
          <HomeScreen />
        </main>
      )}
    </div>
  )
}
