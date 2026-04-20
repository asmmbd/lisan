'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  {
    icon: '📖',
    title: 'আরবি শব্দ শিখুন',
    description: 'কোরআন, হাদিস ও দৈনন্দিন জীবনের গুরুত্বপূর্ণ আরবি শব্দ সহজে শিখুন',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    icon: '🗣️',
    title: 'কথোপকথন অনুশীলন',
    description: 'ভিডিও কলের মাধ্যমে আরবি কথা বলার অনুশীলন করুন এবং দক্ষতা বাড়ান',
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    icon: '📈',
    title: 'প্রতিদিন উন্নতি',
    description: 'প্রতিদিন ৫টি নতুন শব্দ শিখুন এবং ধীরে ধীরে আরবি ভাষায় দক্ষ হন',
    gradient: 'from-green-500 to-teal-600',
  },
]

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onComplete()
    }
  }

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const slide = slides[currentSlide]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={onComplete}
          className="text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
        >
          এড়িয়ে যান
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon with gradient background */}
            <div className={`w-36 h-36 rounded-xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-lg`}>
              <span className="text-6xl">{slide.icon}</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground mb-4 bengali-text">
              {slide.title}
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-base leading-relaxed max-w-xs bengali-text">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-8 pb-12">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <motion.div
              key={idx}
              className={cn_default(
                'h-2 rounded-full transition-all',
                idx === currentSlide ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
              )}
              layout
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            পেছনে
          </Button>

          <Button
            onClick={goNext}
            className="flex-1 max-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-semibold"
          >
            {currentSlide === slides.length - 1 ? 'শুরু করুন' : 'পরবর্তী'}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function cn_default(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
