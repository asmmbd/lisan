'use client'

import { motion } from 'framer-motion'
import { Moon, Sun, Globe, Bell, LogOut, Trash2, ChevronRight, Shield } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

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

export function ProfileScreen() {
  const { theme, setTheme } = useTheme()
  const { data: session, update: updateSession } = useSession()
  const [notifications, setNotifications] = useState(true)
  const { setActiveTab, savedWordIds, notes, updateProfile } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const user = session?.user

  useEffect(() => {
    if (user?.name) setNewName(user.name)
  }, [user?.name])

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
      await updateProfile({ name: newName })
      await updateSession({ name: newName })
      setIsEditing(false)
      toast.success('প্রোফাইল আপডেট হয়েছে')
    } catch (err) {
      toast.error('আপডেট করতে ব্যর্থ হয়েছে')
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="pb-24"
    >
      {/* User Info Card */}
      <motion.div variants={item} className="px-4 pt-4">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <Input 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 py-1 bg-secondary/50 border-primary/20 bengali-text"
                    placeholder="আপনার নাম লিখুন"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateName} className="h-7 text-[10px] bengali-text">সেভ</Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-[10px] bengali-text">বাতিল</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                  <h2 className="text-lg font-bold bengali-text">{user?.name || 'ব্যবহারকারী'}</h2>
                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">সম্পাদনা</span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{user?.email || 'email@example.com'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-0.5">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-medium bengali-text">মাঝারি স্তর</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{savedWordIds.length}</p>
              <p className="text-[10px] text-muted-foreground bengali-text">শব্দ শিখেছেন</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-islamic-gold">{notes.length}</p>
              <p className="text-[10px] text-muted-foreground bengali-text">নোট</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-secondary-foreground">{savedWordIds.length > 0 ? Math.ceil(savedWordIds.length / 5) : 0}</p>
              <p className="text-[10px] text-muted-foreground bengali-text">দিন স্ট্রিক</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Settings Section */}
      <motion.div variants={item} className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 bengali-text">সেটিংস</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium bengali-text">ডার্ক মোড</p>
                <p className="text-[10px] text-muted-foreground bengali-text">অন্ধকার থিম ব্যবহার করুন</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>

          <Separator className="bg-border" />

          {/* Language */}
          <button className="flex items-center justify-between p-4 w-full hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium bengali-text">ভাষা</p>
                <p className="text-[10px] text-muted-foreground bengali-text">বাংলা</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <Separator className="bg-border" />

          {/* Notifications */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium bengali-text">নোটিফিকেশন</p>
                <p className="text-[10px] text-muted-foreground bengali-text">দৈনিক রিমাইন্ডার</p>
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
        </div>
      </motion.div>

      {/* Learning Preferences */}
      <motion.div variants={item} className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 bengali-text">শেখার পছন্দ</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <button className="flex items-center justify-between p-4 w-full hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                <span className="text-base">📖</span>
              </div>
              <div>
                <p className="text-sm font-medium bengali-text">প্রতিদিন শেখার লক্ষ্য</p>
                <p className="text-[10px] text-muted-foreground bengali-text">৫টি শব্দ</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <Separator className="bg-border" />

          <button className="flex items-center justify-between p-4 w-full hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center">
                <span className="text-base">🎯</span>
              </div>
              <div>
                <p className="text-sm font-medium bengali-text">শেখার স্তর</p>
                <p className="text-[10px] text-muted-foreground bengali-text">প্রাথমিক</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Account Section */}
      <motion.div variants={item} className="px-4 mt-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 bengali-text">অ্যাকাউন্ট</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 w-full hover:bg-secondary/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive bengali-text">লগআউট</p>
          </button>

          <Separator className="bg-border" />

          <button className="flex items-center gap-3 p-4 w-full hover:bg-secondary/30 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-destructive bengali-text">অ্যাকাউন্ট মুছুন</p>
              <p className="text-[10px] text-muted-foreground bengali-text">সকল ডাটা মুছে যাবে</p>
            </div>
          </button>
        </div>
      </motion.div>

      {/* App Info */}
      <motion.div variants={item} className="px-4 mt-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md gradient-islamic flex items-center justify-center">
            <span className="text-white text-xs font-bold">ل</span>
          </div>
          <span className="text-sm font-semibold bengali-text">লিসান</span>
        </div>
        <p className="text-[10px] text-muted-foreground bengali-text">সংস্করণ ১.০.০</p>
        <p className="text-[10px] text-muted-foreground bengali-text mt-1">
          بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
        </p>
      </motion.div>
    </motion.div>
  )
}
