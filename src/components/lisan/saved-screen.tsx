'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Bookmark, FileText, Clock, Plus, Trash2, Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useLanguage } from './language-provider'

function SavedSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-4xl mx-auto w-full text-center md:text-left">
        <Skeleton className="h-8 w-24 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="px-4 max-w-4xl mx-auto w-full space-y-4">
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SavedScreen() {
  const [activeTab, setActiveTab] = useState('words')
  const { t, textClass } = useLanguage()
  const { isLoading, savedWordIds } = useAppStore()

  if (isLoading) {
    return <SavedSkeleton />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-6 md:pt-10 pb-4 max-w-4xl mx-auto w-full text-center md:text-left">
        <h1 className={cn('text-xl md:text-3xl font-black', textClass)}>{t('saved.title')}</h1>
        <p className={cn('text-sm md:text-base text-muted-foreground mt-1', textClass)}>{t('saved.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col px-4 max-w-4xl mx-auto w-full">
        <TabsList className="w-full bg-secondary/50 rounded-xl h-11 p-1 mb-6">
          <TabsTrigger value="words" className="rounded-lg flex-1 gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Bookmark className="w-3.5 h-3.5" />
            <span className={textClass}>{t('saved.wordsTab')}</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg flex-1 gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <FileText className="w-3.5 h-3.5" />
            <span className={textClass}>{t('saved.notesTab')}</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg flex-1 gap-1.5 text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            <span className={textClass}>{t('saved.historyTab')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="words" className="flex-1 mt-0">
          <SavedWordsList />
        </TabsContent>
        <TabsContent value="notes" className="flex-1 mt-0">
          <NotesList />
        </TabsContent>
        <TabsContent value="history" className="flex-1 mt-0">
          <SearchHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SavedWordsList() {
  const { t, textClass } = useLanguage()
  const { savedWordIds, toggleSaveWord, vocabulary } = useAppStore()
  const savedWords = (vocabulary as any[]).filter((w) => savedWordIds.includes(w.id))

  if (savedWords.length === 0) {
    return (
      <EmptyState
        icon={<Bookmark className="w-8 h-8 text-muted-foreground" />}
        title={t('saved.noSavedWords')}
        description={t('saved.saveFromDictionary')}
      />
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-260px)]">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.05 } },
        }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-24 md:pb-10"
      >
        {savedWords.map((word) => (
          <motion.div
            key={word.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
            className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border"
          >
            <div className="flex-1 min-w-0">
              <p className="arabic-text text-lg font-bold">{word.arabic}</p>
              <p className={cn('text-sm text-card-foreground', textClass)}>{word.bengali}</p>
              <p className="text-xs text-muted-foreground">{word.pronunciation}</p>
            </div>
            <button
              onClick={() => toggleSaveWord(word.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </motion.div>
        ))}
      </motion.div>
    </ScrollArea>
  )
}

function NotesList() {
  const { t, textClass } = useLanguage()
  const { notes, addNote, deleteNote } = useAppStore()
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState('')

  const handleAdd = () => {
    if (newNote.trim()) {
      addNote(newNote.trim())
      setNewNote('')
      setIsAdding(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-260px)]">
      <Button
        onClick={() => setIsAdding(!isAdding)}
        className="w-full gap-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl h-10 mb-3 border-0"
        variant="outline"
      >
        <Plus className="w-4 h-4" />
        <span className={cn('text-sm', textClass)}>{t('saved.newNote')}</span>
      </Button>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-card rounded-xl border border-border p-3">
              <Textarea
                placeholder={t('saved.writeNote')}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className={cn('min-h-[80px] border-0 bg-transparent resize-none p-0 focus-visible:ring-0', textClass)}
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setIsAdding(false); setNewNote('') }}
                  className={cn('text-xs', textClass)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  className={cn('text-xs bg-primary hover:bg-primary/90 rounded-lg', textClass)}
                  disabled={!newNote.trim()}
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollArea className="flex-1">
        {notes.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-muted-foreground" />}
            title={t('saved.noNotes')}
            description={t('saved.noNotesDescription')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-24 md:pb-10">
            {notes.map((note, idx) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-xl p-3 border border-border"
              >
                <p className={cn('text-sm whitespace-pre-wrap', textClass)}>{note.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-muted-foreground">{note.createdAt}</p>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function SearchHistory() {
  const { t, textClass, formatNumber } = useLanguage()
  const { searchHistory, clearHistory } = useAppStore()

  if (searchHistory.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-8 h-8 text-muted-foreground" />}
        title={t('saved.noHistory')}
        description={t('saved.noHistoryDescription')}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className={cn('text-xs text-muted-foreground', textClass)}>{formatNumber(searchHistory.length)} {t('saved.searches')}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className={cn('text-xs text-destructive hover:text-destructive h-7', textClass)}
        >
          {t('saved.clearAll')}
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-2 pb-24">
          {searchHistory.map((term, idx) => (
            <motion.div
              key={`${term}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium arabic-text">{term}</p>
              </div>
              <Badge variant="secondary" className={cn('text-[10px]', textClass)}>{t('saved.searched')}</Badge>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  const { textClass } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className={cn('text-base font-semibold mb-1', textClass)}>{title}</h3>
      <p className={cn('text-sm text-muted-foreground', textClass)}>{description}</p>
    </div>
  )
}
