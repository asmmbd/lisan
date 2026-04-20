'use client'

import { useEffect } from 'react'
import { PracticeScreen } from '@/components/lisan/practice-screen'
import { useAppStore } from '@/lib/store'

export default function PracticePage() {
  const { fetchUserData } = useAppStore()

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return <PracticeScreen />
}
