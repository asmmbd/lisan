'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Volume2, Bookmark, BookmarkCheck, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'
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
  const { savedWordIds, toggleSaveWord, searchHistory, addToHistory, categories, isLoading } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null)

  // Search state
  const [searchResults, setSearchResults] = useState<VocabularyWord[]>([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Server-side search function
  const doSearch = useCallback(async (q: string, category: string | null) => {
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort()

    if (!q.trim() && !category) {
      setSearchResults([])
      setSearchTotal(0)
      setHasSearched(false)
      setIsSearching(false)
      return
    }

    abortRef.current = new AbortController()
    setIsSearching(true)

    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (category) params.set('category', category)
      params.set('limit', '50')

      const res = await fetch(`/api/vocabulary?${params.toString()}`, {
        signal: abortRef.current.signal,
        cache: 'no-store',
      })

      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setSearchResults(data.vocabulary || [])
      setSearchTotal(data.total ?? data.vocabulary?.length ?? 0)
      setHasSearched(true)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err)
      }
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(searchQuery, activeCategory)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery, activeCategory, doSearch])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setActiveCategory(null)
  }

  const handleCategoryClick = (slug: string) => {
    setSearchQuery('')
    setActiveCategory(slug)
  }

  const handleClear = () => {
    setSearchQuery('')
    setActiveCategory(null)
    setSearchResults([])
    setHasSearched(false)
  }

  const handleHistoryClick = (term: string) => {
    setSearchQuery(term)
    setActiveCategory(null)
  }

  const handleSelectWord = (word: VocabularyWord) => {
    setSelectedWord(word)
    addToHistory(word.arabic)
  }

  const showBrowse = !searchQuery.trim() && !activeCategory && !hasSearched
  const showResults = searchQuery.trim() || activeCategory || hasSearched

  if (isLoading && categories.length === 0) {
    return <DictionarySkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-2xl mx-auto w-full">
        <h1 className={cn('text-xl md:text-3xl font-black mb-4 text-center md:text-left', textClass)}>
          {t('dictionary.title')}
        </h1>
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
          {(searchQuery || activeCategory) && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Active category badge */}
        {activeCategory && !searchQuery && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className={cn('gap-1', textClass)}>
              {categories.find(c => c.slug === activeCategory)?.icon}{' '}
              {categories.find(c => c.slug === activeCategory)?.title}
              <button onClick={handleClear} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {showResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-2 pb-24"
            >
              {/* Loading indicator */}
              {isSearching && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className={textClass}>খুঁজছি...</span>
                </div>
              )}

              {!isSearching && hasSearched && searchResults.length === 0 && (
                <EmptySearchState />
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {!isSearching && (
                    <p className={cn('text-xs text-muted-foreground mb-2', textClass)}>
                      {searchTotal > 50
                        ? `${formatNumber(50)}+ ${t('dictionary.resultsFound')}`
                        : `${formatNumber(searchResults.length)} ${t('dictionary.resultsFound')}`}
                    </p>
                  )}
                  {searchResults.map((word, idx) => (
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
              <h3 className={cn('text-sm font-bold text-muted-foreground mb-4 tracking-wide uppercase', textClass)}>
                {t('dictionary.browse')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border hover:shadow-sm transition-shadow"
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <div className="text-left">
                      <p className={cn('text-sm font-medium', textClass)}>{cat.title}</p>
                      <p className={cn('text-[10px] text-muted-foreground', textClass)}>
                        {cat.wordCount ? `${formatNumber(cat.wordCount)} ${t('home.words')}` : t('home.words')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {searchHistory.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={cn('text-sm font-semibold text-muted-foreground', textClass)}>
                      {t('dictionary.recentSearches')}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((term, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className={cn('cursor-pointer hover:bg-secondary/80', textClass)}
                        onClick={() => handleHistoryClick(term)}
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
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
