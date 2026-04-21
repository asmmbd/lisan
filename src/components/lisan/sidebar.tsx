'use client'

import { BookOpen, Video, Bookmark, User, Home, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { signOut } from 'next-auth/react'
import { useLanguage } from './language-provider'

export function Sidebar() {
  const pathname = usePathname()
  const { t, textClass } = useLanguage()

  const tabs = [
    { id: 'home', label: t('nav.home'), icon: Home, href: '/' },
    { id: 'dictionary', label: t('nav.dictionary'), icon: BookOpen, href: '/dictionary' },
    { id: 'practice', label: t('nav.practice'), icon: Video, href: '/practice' },
    { id: 'saved', label: t('nav.saved'), icon: Bookmark, href: '/saved' },
    { id: 'profile', label: t('nav.profile'), icon: User, href: '/profile' },
  ]

  return (
    <aside className="sidebar-shell hidden md:flex flex-col w-64 h-screen fixed top-0 z-50 bg-card/80 backdrop-blur-xl py-8 px-4 overflow-y-auto overflow-x-hidden">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-primary/20">
          <Image src="/lisan-logo.png" alt="Lisan Logo" width={40} height={40} className="object-cover" />
        </div>
        <div>
          <h1 className={cn('text-xl font-bold tracking-tight text-foreground', textClass)}>{t('common.appName')}</h1>
          <p className={cn('text-[10px] text-muted-foreground uppercase tracking-widest font-semibold', textClass)}>{t('nav.tagline')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          const Icon = tab.icon
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform duration-300', isActive ? 'scale-110' : 'group-hover:scale-110')} />
              <span className={cn('text-sm font-medium', textClass, isActive ? 'font-semibold' : 'opacity-80 group-hover:opacity-100')}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeSidebarTab"
                  className="sidebar-active-indicator absolute w-1 h-6 bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-border/50">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className={cn('text-sm font-medium', textClass)}>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  )
}
