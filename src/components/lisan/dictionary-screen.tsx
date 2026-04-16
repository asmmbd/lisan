'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Mic, X, Volume2, Bookmark, BookmarkCheck, ArrowLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { vocabularyWords, type VocabularyWord } from '@/lib/vocabulary-data'
import { useAppStore } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'

export function DictionaryScreen() {
  const { savedWordIds, toggleSaveWord, searchHistory, addToHistory } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Auto-focus the search input when screen mounts
    const timer = setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return vocabularyWords.filter(
      (w) =>
        w.arabic.includes(q) ||
        w.bengali.includes(q) ||
        w.pronunciation.toLowerCase().includes(q) ||
        w.category.includes(q)
    )
  }, [searchQuery])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setIsSearching(value.length > 0)
  }

  const handleSelectWord = (word: VocabularyWord) => {
    setSelectedWord(word)
    addToHistory(word.arabic)
  }

  const handleHistoryClick = (term: string) => {
    setSearchQuery(term)
    setIsSearching(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold bengali-text mb-3">ডিকশনারি</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="আরবি বা বাংলা লিখে খুঁজুন"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="pl-10 pr-10 h-11 rounded-xl bg-secondary/50 border-border bengali-text"
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

      {/* Content */}
      <ScrollArea className="flex-1 px-4">
        <AnimatePresence mode="wait">
          {isSearching && searchQuery ? (
            /* Search Results */
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
                  <p className="text-xs text-muted-foreground bengali-text mb-2">
                    {filteredWords.length}টি ফলাফল পাওয়া গেছে
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
            /* Default state - Browse & History */
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-2 pb-24"
            >
              {/* Browse by category */}
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 bengali-text">বিভাগ অনুসারে ব্রাউজ</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {Object.entries({
                  quranic: { title: 'কোরআনিক', emoji: '📖', count: 5 },
                  hadith: { title: 'হাদিসের', emoji: '📿', count: 5 },
                  daily: { title: 'দৈনন্দিন', emoji: '🏠', count: 5 },
                  study: { title: 'পড়াশোনা', emoji: '📚', count: 3 },
                  food: { title: 'খাবার', emoji: '🍽️', count: 2 },
                  family: { title: 'পরিবার', emoji: '👨‍👩‍👧‍👦', count: 3 },
                  sports: { title: 'খেলাধুলা', emoji: '⚽', count: 3 },
                  travel: { title: 'ভ্রমণ', emoji: '✈️', count: 2 },
                }).map(([key, cat]) => (
                  <button
                    key={key}
                    onClick={() => { setSearchQuery(key === 'quranic' ? 'كتاب' : key); setIsSearching(true) }}
                    className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border hover:shadow-sm transition-shadow"
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium bengali-text">{cat.title}</p>
                      <p className="text-[10px] text-muted-foreground bengali-text">{cat.count} শব্দ</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-muted-foreground bengali-text">সাম্প্রতিক অনুসন্ধান</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((term, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 bengali-text"
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

      {/* Word Detail Modal */}
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
        <p className="text-sm text-card-foreground bengali-text truncate">{word.bengali}</p>
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
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-card rounded-t-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
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
                <span className="text-xs font-medium bengali-text">সেভ আছে</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span className="text-xs font-medium bengali-text">সেভ করুন</span>
              </>
            )}
          </button>
        </div>

        {/* Word Content */}
        <div className="px-5 pb-8">
          <div className="text-center mb-6">
            <p className="arabic-text text-5xl font-bold text-foreground mb-2">{word.arabic}</p>
            <p className="text-muted-foreground text-sm">{word.pronunciation}</p>
          </div>

          <div className="space-y-4">
            {/* Meaning */}
            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 bengali-text">অর্থ</p>
              <p className="text-lg font-semibold bengali-text">{word.bengali}</p>
            </div>

            {/* Example */}
            <div className="bg-accent/50 rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1 bengali-text">উদাহরণ</p>
              <p className="arabic-text text-lg mb-1">{word.example}</p>
              <p className="text-sm text-muted-foreground bengali-text">{word.exampleTranslation}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                className="flex-1 gap-2 bg-primary hover:bg-primary/90 rounded-xl h-11"
              >
                <Volume2 className="w-4 h-4" />
                <span className="bengali-text">উচ্চারণ শুনুন</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function EmptySearchState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold bengali-text mb-1">কোনো ফলাফল পাওয়া যায়নি</h3>
      <p className="text-sm text-muted-foreground bengali-text">অন্য কোনো শব্দ দিয়ে খুঁজে দেখুন</p>
    </div>
  )
}
