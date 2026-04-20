'use client'

import { useEffect } from 'react'
import { ProfileScreen } from '@/components/lisan/profile-screen'
import { useAppStore } from '@/lib/store'

export default function ProfilePage() {
  const { fetchUserData } = useAppStore()

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  return <ProfileScreen />
}
