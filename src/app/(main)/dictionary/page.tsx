'use client'

import { useEffect } from 'react'
import { DictionaryScreen } from '@/components/lisan/dictionary-screen'
import { useAppStore } from '@/lib/store'

export default function DictionaryPage() {
  const { fetchUserData } = useAppStore()

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return <DictionaryScreen />
}
