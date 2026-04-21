'use client'

import { motion } from 'framer-motion'
import { Moon, Sun, Globe, Bell, LogOut, Trash2, Shield, Camera, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLanguage } from './language-provider'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

function ProfileSkeleton() {
  return (
    <div className="pb-24 max-w-4xl mx-auto w-full px-0 md:px-6 space-y-6">
      <div className="px-4 pt-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="bg-card rounded-xl border border-border overflow-hidden space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="w-10 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProfileScreen() {
  const { theme, setTheme } = useTheme()
  const { data: session, status, update: updateSession } = useSession()
  const { language, setLanguage, t, textClass, formatNumber } = useLanguage()
  const [notifications, setNotifications] = useState(true)
  const { savedWordIds, notes, updateProfile, isLoading } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [newName, setNewName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const user = session?.user

  useEffect(() => {
    if (user?.name) setNewName(user.name)
  }, [user?.name])

  if (status === 'loading' || isLoading) {
    return <ProfileSkeleton />
  }

  const isDark = theme === 'dark'

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) return
    try {
      const updatedUser = await updateProfile({ name: newName })
      await updateSession({ name: newName })
      if (updatedUser?.image !== undefined) {
        await updateSession({ image: updatedUser.image })
      }
      setIsEditing(false)
      toast.success(t('profile.profileUpdated'))
    } catch {
      toast.error(t('profile.profileUpdateFailed'))
    }
  }

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.photoFileTypeError'))
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profile.photoSizeError'))
      event.target.value = ''
      return
    }

    setIsUploadingImage(true)

    try {
      const authResponse = await fetch('/api/imagekit/auth', { cache: 'no-store' })
      const authPayload = await authResponse.json()

      if (!authResponse.ok) {
        throw new Error(authPayload.error || 'Failed to get upload auth')
      }

      const safeFileName = `${user?.id || 'user'}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', safeFileName)
      formData.append('folder', '/lisan/profile-photos')
      formData.append('useUniqueFileName', 'true')
      formData.append('token', authPayload.token)
      formData.append('expire', String(authPayload.expire))
      formData.append('signature', authPayload.signature)
      formData.append('publicKey', authPayload.publicKey)

      const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadPayload = await uploadResponse.json()

      if (!uploadResponse.ok || !uploadPayload.url) {
        throw new Error(uploadPayload.message || 'Upload failed')
      }

      const updatedUser = await updateProfile({ image: uploadPayload.url })
      await updateSession({ image: updatedUser.image })
      toast.success(t('profile.photoUpdated'))
    } catch (error) {
      console.error('Image upload failed:', error)
      toast.error(t('profile.photoUpdateFailed'))
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-24 max-w-4xl mx-auto w-full px-0 md:px-6"
    >
      <motion.div variants={item} className="px-4 pt-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-primary/20">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={user?.name || t('common.unknownUser')} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
                aria-label={t('profile.changePhoto')}
              >
                {isUploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={cn('h-8 py-1 bg-secondary/50 border-primary/20', textClass)}
                    placeholder={t('profile.namePlaceholder')}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateName} className={cn('h-7 text-[10px]', textClass)}>{t('common.save')}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className={cn('h-7 text-[10px]', textClass)}>{t('common.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                  <h2 className={cn('text-lg font-bold', textClass)}>{user?.name || t('common.unknownUser')}</h2>
                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">{t('profile.edit')}</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground ltr-safe">{user?.email || 'email@example.com'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className={cn('text-[10px] text-primary font-medium', textClass)}>{t('profile.level')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className={cn('mt-2 text-xs font-medium text-primary transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60', textClass)}
              >
                {isUploadingImage ? t('profile.uploadingPhoto') : t('profile.changePhoto')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{formatNumber(savedWordIds.length)}</p>
              <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('profile.wordsLearned')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-islamic-gold">{formatNumber(notes.length)}</p>
              <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('profile.notes')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-secondary-foreground">{formatNumber(savedWordIds.length > 0 ? Math.ceil(savedWordIds.length / 5) : 0)}</p>
              <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('profile.streak')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 px-4 md:px-0">
        <motion.div variants={item}>
          <h3 className={cn('text-sm font-bold text-muted-foreground mb-3 tracking-wide uppercase', textClass)}>{t('profile.settings')}</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                  {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
                </div>
                <div>
                  <p className={cn('text-sm font-medium', textClass)}>{t('profile.darkMode')}</p>
                  <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('profile.darkModeDescription')}</p>
                </div>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
            </div>

            <Separator className="bg-border" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', textClass)}>{t('profile.language')}</p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={language === 'bn' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLanguage('bn')}
                      className="rounded-full"
                    >
                      {t('profile.bangla')}
                    </Button>
                    <Button
                      type="button"
                      variant={language === 'ar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLanguage('ar')}
                      className="rounded-full arabic-text"
                    >
                      {t('profile.arabic')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className={cn('text-sm font-medium', textClass)}>{t('profile.notifications')}</p>
                  <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('profile.notificationsDescription')}</p>
                </div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={item}>
          <h3 className={cn('text-sm font-bold text-muted-foreground mb-3 tracking-wide uppercase', textClass)}>{t('profile.learningPreferences')}</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                  <span className="text-base">📖</span>
                </div>
                <div>
                  <p className={cn('text-sm font-medium', textClass)}>{t('profile.dailyGoal')}</p>
                  <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('profile.dailyGoalValue')}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="flex items-center justify-between p-4 w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                  <span className="text-base">🎯</span>
                </div>
                <div>
                  <p className={cn('text-sm font-medium', textClass)}>{t('profile.learningLevel')}</p>
                  <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('profile.learningLevelValue')}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="px-4 md:px-0 mt-8">
        <h3 className={cn('text-sm font-bold text-muted-foreground mb-3 tracking-wide uppercase', textClass)}>{t('profile.account')}</h3>
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 w-full hover:bg-secondary/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <p className={cn('text-sm font-medium text-destructive', textClass)}>{t('nav.logout')}</p>
          </button>

          <Separator className="bg-border" />

          <button className="flex items-center gap-3 p-4 w-full hover:bg-secondary/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className={cn('text-sm font-medium text-destructive', textClass)}>{t('profile.deleteAccount')}</p>
              <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('profile.deleteAccountWarning')}</p>
            </div>
          </button>
        </div>
      </motion.div>

      <motion.div variants={item} className="px-4 mt-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md gradient-islamic flex items-center justify-center">
            <span className="text-white text-xs font-bold">ل</span>
          </div>
          <span className={cn('text-sm font-semibold', textClass)}>{t('common.appName')}</span>
        </div>
        <p className={cn('text-[10px] text-muted-foreground', textClass)}>{t('common.version')}</p>
        <p className="text-[10px] text-muted-foreground arabic-text mt-1">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
      </motion.div>
    </motion.div>
  )
}
