'use client'

import { BookOpen, Video, Bookmark, User, Home, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { signOut } from 'next-auth/react'

const tabs = [
  { id: 'home', label: 'হোম', icon: Home, href: '/' },
  { id: 'dictionary', label: 'ডিকশনারি', icon: BookOpen, href: '/dictionary' },
  { id: 'practice', label: 'প্র্যাকটিস', icon: Video, href: '/practice' },
  { id: 'saved', label: 'সেভ', icon: Bookmark, href: '/saved' },
  { id: 'profile', label: 'প্রোফাইল', icon: User, href: '/profile' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 z-50 bg-card/80 backdrop-blur-xl border-r border-border py-8 px-4 overflow-y-auto overflow-x-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-primary/20">
          <Image src="/lisan-logo.png" alt="Lisan Logo" width={40} height={40} className="object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground bengali-text">লিসান</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Arabic Learning</p>
        </div>
      </div>

      {/* Navigation */}
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
              <span className={cn('text-sm font-medium bengali-text', isActive ? 'font-semibold' : 'opacity-80 group-hover:opacity-100')}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeSidebarTab"
                  className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Account */}
      <div className="mt-auto pt-4 border-t border-border/50">
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium bengali-text">লগআউট</span>
        </button>
      </div>
    </aside>
  )
}
