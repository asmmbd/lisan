import { create } from 'zustand'

export type TabType = 'home' | 'dictionary' | 'practice' | 'saved' | 'profile'

interface VocabularyWord {
  id: string
  arabic: string
  bengali: string
  pronunciation: string
  example: string
  exampleTranslation: string
  category: string
}

interface AppState {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  showOnboarding: boolean
  setShowOnboarding: (show: boolean) => void
  savedWordIds: string[]
  toggleSaveWord: (id: string) => void
  notes: { id: string; text: string; createdAt: string }[]
  addNote: (text: string) => void
  deleteNote: (id: string) => void
  searchHistory: string[]
  addToHistory: (term: string) => void
  clearHistory: () => void
  practiceState: 'idle' | 'matching' | 'incoming' | 'incall'
  setPracticeState: (state: 'idle' | 'matching' | 'incoming' | 'incall') => void
  callTimer: number
  setCallTimer: (time: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  showOnboarding: false,
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  savedWordIds: ['1', '3', '5'],
  toggleSaveWord: (id) =>
    set((state) => ({
      savedWordIds: state.savedWordIds.includes(id)
        ? state.savedWordIds.filter((wId) => wId !== id)
        : [...state.savedWordIds, id],
    })),
  notes: [
    { id: '1', text: 'بسم الله - সব কাজ শুরু বিসমিল্লাহ দিয়ে', createdAt: '2024-01-15' },
  ],
  addNote: (text) =>
    set((state) => ({
      notes: [
        { id: Date.now().toString(), text, createdAt: new Date().toISOString() },
        ...state.notes,
      ],
    })),
  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    })),
  searchHistory: ['كتاب', 'مسجد', 'سلام'],
  addToHistory: (term) =>
    set((state) => ({
      searchHistory: [term, ...state.searchHistory.filter((t) => t !== term)].slice(0, 20),
    })),
  clearHistory: () => set({ searchHistory: [] }),
  practiceState: 'idle',
  setPracticeState: (state) => set({ practiceState: state }),
  callTimer: 240,
  setCallTimer: (time) => set({ callTimer: time }),
}))
