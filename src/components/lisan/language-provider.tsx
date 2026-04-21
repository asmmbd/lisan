'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Language, formatNumber, getLanguageDirection, getLocalizedTextClass, getNestedMessage, interpolate } from '@/lib/i18n'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  textClass: string
  dir: 'ltr' | 'rtl'
  formatNumber: (value: number) => string
}

const STORAGE_KEY = 'lisan-language'

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('bn')

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY) as Language | null
    if (savedLanguage === 'bn' || savedLanguage === 'ar') {
      setLanguageState(savedLanguage)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.lang = language
    root.dir = getLanguageDirection(language)
    root.dataset.language = language
  }, [language])

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    window.localStorage.setItem(STORAGE_KEY, nextLanguage)
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    return interpolate(getNestedMessage(language, key), vars)
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    textClass: getLocalizedTextClass(language),
    dir: getLanguageDirection(language),
    formatNumber: (value: number) => formatNumber(value, language),
  }), [language, setLanguage, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }

  return context
}
