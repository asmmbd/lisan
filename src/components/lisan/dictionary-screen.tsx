'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Mic, X, Volume2, Bookmark, BookmarkCheck, ArrowLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useLanguage } from './language-provider'

interface VocabularyWord {
  id: string
  arabic: string
  bengali: string
  pronunciation: string
  example: string
  exampleTranslation: string
  categorySlug: string
}

function DictionarySkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-2xl mx-auto w-full">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
      <div className="flex-1 px-4 space-y-4">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function DictionaryScreen() {
  const { t, textClass, formatNumber } = useLanguage()
  const { savedWordIds, toggleSaveWord, searchHistory, addToHistory, vocabulary, categories, isLoading } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const [debouncedQuery, setDebouncedQuery] = useState('')
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300) // 300ms delay
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  const filteredWords = useMemo(() => {
    if (!debouncedQuery.trim()) return []
    const q = debouncedQuery.toLowerCase()
    // Limit to first 100 matches for performance
    const results: VocabularyWord[] = []
    for (const w of vocabulary as VocabularyWord[]) {
      if (
        w.arabic.toLowerCase().includes(q) ||
        w.bengali.toLowerCase().includes(q) ||
        w.pronunciation.toLowerCase().includes(q)
      ) {
        results.push(w)
        if (results.length >= 100) break // Stop at 100 matches
      }
    }
    return results
  }, [debouncedQuery, vocabulary])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setIsSearching(value.length > 0)
  }

  const handleSelectWord = (word: VocabularyWord) => {
    setSelectedWord(word)
    addToHistory(word.arabic)
  }

  if (isLoading || (categories.length === 0 && vocabulary.length === 0)) {
    return <DictionarySkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-2xl mx-auto w-full">
        <h1 className={cn('text-xl md:text-3xl font-black mb-4 text-center md:text-left', textClass)}>{t('dictionary.title')}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={t('dictionary.placeholder')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className={cn('pl-10 pr-10 h-11 rounded-xl bg-secondary/50 border-border', textClass)}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setIsSearching(false) }}
              className="absolute right-12 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button className="absolute right-3 top-1/2 -translate-y-1/2">
            <Mic className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {isSearching && debouncedQuery ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-2 pb-24"
            >
              {filteredWords.length === 0 ? (
                <EmptySearchState />
              ) : (
                <div className="space-y-2">
                  <p className={cn('text-xs text-muted-foreground mb-2', textClass)}>
                    {(vocabulary as VocabularyWord[]).length > 100 && filteredWords.length >= 100 
                      ? `100+ ${t('dictionary.resultsFound')} (showing first 100)`
                      : `${formatNumber(filteredWords.length)} ${t('dictionary.resultsFound')}`}
                  </p>
                  {filteredWords.map((word, idx) => (
                    <WordListItem
                      key={word.id}
                      word={word}
                      isSaved={savedWordIds.includes(word.id)}
                      onSelect={() => handleSelectWord(word)}
                      onToggleSave={() => toggleSaveWord(word.id)}
                      index={idx}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-2 pb-24"
            >
              <h3 className={cn('text-sm font-bold text-muted-foreground mb-4 tracking-wide uppercase', textClass)}>{t('dictionary.browse')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSearchQuery(cat.slug); setIsSearching(true) }}
                    className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border hover:shadow-sm transition-shadow"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <div className="text-left">
                      <p className={cn('text-sm font-medium', textClass)}>{cat.title}</p>
                      <p className={cn('text-[10px] text-muted-foreground', textClass)}>
                        {formatNumber(vocabulary.filter((v: any) => v.categorySlug === cat.slug).length)} {t('home.words')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {searchHistory.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={cn('text-sm font-semibold text-muted-foreground', textClass)}>{t('dictionary.recentSearches')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((term, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className={cn('cursor-pointer hover:bg-secondary/80', textClass)}
                        onClick={() => handleSearch(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>

      <AnimatePresence>
        {selectedWord && (
          <WordDetailModal
            word={selectedWord}
            isSaved={savedWordIds.includes(selectedWord.id)}
            onClose={() => setSelectedWord(null)}
            onToggleSave={() => toggleSaveWord(selectedWord.id)}
          />
        )}
      </AnimatePresence>
    </div>
  )

  function EmptySearchState() {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className={cn('text-base font-semibold mb-1', textClass)}>{t('dictionary.noResults')}</h3>
        <p className={cn('text-sm text-muted-foreground', textClass)}>{t('dictionary.noResultsDescription')}</p>
      </div>
    )
  }
}

function WordListItem({
  word,
  isSaved,
  onSelect,
  onToggleSave,
  index,
}: {
  word: VocabularyWord
  isSaved: boolean
  onSelect: () => void
  onToggleSave: () => void
  index: number
}) {
  const { textClass } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="arabic-text text-lg font-bold">{word.arabic}</p>
          <span className="text-xs text-muted-foreground">({word.pronunciation})</span>
        </div>
        <p className={cn('text-sm text-card-foreground truncate', textClass)}>{word.bengali}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave() }}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-primary" />
          ) : (
            <Bookmark className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </motion.div>
  )
}

function WordDetailModal({
  word,
  isSaved,
  onClose,
  onToggleSave,
}: {
  word: VocabularyWord
  isSaved: boolean
  onClose: () => void
  onToggleSave: () => void
}) {
  const { t, textClass } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 300, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-card rounded-t-xl md:rounded-xl overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between px-5 pb-2">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span className={cn('text-xs font-medium', textClass)}>{t('dictionary.saved')}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span className={cn('text-xs font-medium', textClass)}>{t('dictionary.save')}</span>
              </>
            )}
          </button>
        </div>

        <div className="px-5 pb-8">
          <div className="text-center mb-6">
            <p className="arabic-text text-5xl font-bold text-foreground mb-2">{word.arabic}</p>
            <p className="text-muted-foreground text-sm">{word.pronunciation}</p>
          </div>

          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className={cn('text-xs text-muted-foreground mb-1', textClass)}>{t('dictionary.meaning')}</p>
              <p className={cn('text-lg font-semibold', textClass)}>{word.bengali}</p>
            </div>

            <div className="bg-accent/50 rounded-xl p-4">
              <p className={cn('text-xs text-muted-foreground mb-1', textClass)}>{t('dictionary.example')}</p>
              <p className="arabic-text text-lg mb-1">{word.example}</p>
              <p className={cn('text-sm text-muted-foreground', textClass)}>{word.exampleTranslation}</p>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2 bg-primary hover:bg-primary/90 rounded-xl h-11"
              >
                <Volume2 className="w-4 h-4" />
                <span className={textClass}>{t('common.listen')}</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
