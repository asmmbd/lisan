'use client'

import { Video, Bookmark, User } from 'lucide-react'
import { Home2 , Book1} from 'iconsax-reactjs'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from './language-provider'

export function BottomNav() {
  const pathname = usePathname()
  const { t, textClass } = useLanguage()

  const tabs = [
    { id: 'home', label: t('nav.home'), icon: Home2, href: '/' },
    { id: 'dictionary', label: t('nav.dictionary'), icon: Book1, href: '/dictionary' },
    { id: 'practice', label: t('nav.practice'), icon: Video, href: '/practice' },
    { id: 'saved', label: t('nav.saved'), icon: Bookmark, href: '/saved' },
    { id: 'profile', label: t('nav.profile'), icon: User, href: '/profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom md:hidden">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname.startsWith(tab.href))
          const Icon = tab.icon
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
              <span className={cn('text-[10px] font-medium', textClass, isActive && 'font-semibold')}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
