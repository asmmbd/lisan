'use client'

import { useEffect } from 'react'
import { SavedScreen } from '@/components/lisan/saved-screen'
import { useAppStore } from '@/lib/store'

export default function SavedPage() {
  const { fetchUserData } = useAppStore()

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return <SavedScreen />
}
