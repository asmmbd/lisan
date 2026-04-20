import { create } from 'zustand'

export type TabType = 'home' | 'dictionary' | 'practice' | 'saved' | 'profile'

interface Note {
  id: string
  text: string
  createdAt: string
}

interface AppState {
  showOnboarding: boolean
  setShowOnboarding: (show: boolean) => void
  savedWordIds: string[]
  setSavedWordIds: (ids: string[]) => void
  toggleSaveWord: (id: string) => Promise<void>
  notes: Note[]
  setNotes: (notes: Note[]) => void
  addNote: (text: string) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  searchHistory: string[]
  setSearchHistory: (terms: string[]) => void
  addToHistory: (term: string) => Promise<void>
  clearHistory: () => Promise<void>
  practiceState: 'idle' | 'matching' | 'incoming' | 'incall'
  setPracticeState: (state: 'idle' | 'matching' | 'incoming' | 'incall') => void
  callTimer: number
  setCallTimer: (time: number) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
  // Vocabulary & Categories (Dynamic)
  vocabulary: any[]
  categories: any[]
  vocabularySets: any[]
  setVocabulary: (vocabulary: any[]) => void
  setCategories: (categories: any[]) => void
  setVocabularySets: (sets: any[]) => void
  // User Actions
  updateProfile: (data: { name?: string; image?: string }) => Promise<void>
  // Fetch all user data
  fetchUserData: () => Promise<void>
  // Quiz State
  quizState: 'idle' | 'running' | 'completed'
  quizCurrentIndex: number
  quizScore: number
  quizQuestions: any[]
  quizSettings: { category?: string; setId?: string; title?: string } | null
  startQuiz: (settings: { category?: string; setId?: string; title?: string }) => void
  submitAnswer: (isCorrect: boolean) => void
  resetQuiz: () => void
  // Streak System
  streak: number
  longestStreak: number
  totalXP: number
  studiedToday: boolean
  streakBroken: boolean
  fetchStreak: () => Promise<void>
  updateStreak: (xp?: number) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // UI State
  showOnboarding: false,
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  
  // Vocabulary & Metadata
  vocabulary: [],
  categories: [],
  vocabularySets: [],
  setVocabulary: (vocabulary) => set({ vocabulary }),
  setCategories: (categories) => set({ categories }),
  setVocabularySets: (vocabularySets) => set({ vocabularySets }),
  
  // Loading & Error
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  
  // User Profile
  updateProfile: async (data) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) throw new Error('Failed to update profile')
      
      // We don't necessarily update a global "user" state in Zustand 
      // since NextAuth handles it, but we could if we wanted to.
      // For now, NextAuth will pick it up on next session refresh.
    } catch (err) {
      console.error('Error updating profile:', err)
      set({ error: 'Failed to update profile' })
    }
  },
  
  // Saved Words (API-backed)
  savedWordIds: [],
  setSavedWordIds: (ids) => set({ savedWordIds: ids }),
  toggleSaveWord: async (id) => {
    try {
      const response = await fetch('/api/user/saved-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: id }),
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      const data = await response.json()
      
      // Update local state based on server response
      set((state) => ({
        savedWordIds: data.saved
          ? [...state.savedWordIds, id]
          : state.savedWordIds.filter((wId) => wId !== id),
      }))
    } catch (err) {
      console.error('Error saving word:', err)
      set({ error: 'Failed to save word' })
    }
  },
  
  // Notes (API-backed)
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: async (text) => {
    try {
      const response = await fetch('/api/user/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      
      if (!response.ok) throw new Error('Failed to add note')
      
      const data = await response.json()
      
      set((state) => ({
        notes: [data.note, ...state.notes],
      }))
    } catch (err) {
      console.error('Error adding note:', err)
      set({ error: 'Failed to add note' })
    }
  },
  deleteNote: async (id) => {
    try {
      const response = await fetch('/api/user/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id }),
      })
      
      if (!response.ok) throw new Error('Failed to delete note')
      
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }))
    } catch (err) {
      console.error('Error deleting note:', err)
      set({ error: 'Failed to delete note' })
    }
  },
  
  // Search History (API-backed)
  searchHistory: [],
  setSearchHistory: (terms) => set({ searchHistory: terms }),
  addToHistory: async (term) => {
    try {
      await fetch('/api/user/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term }),
      })
      
      // Update local state
      set((state) => ({
        searchHistory: [term, ...state.searchHistory.filter((t) => t !== term)].slice(0, 20),
      }))
    } catch (err) {
      console.error('Error adding to history:', err)
    }
  },
  clearHistory: async () => {
    try {
      await fetch('/api/user/search-history', {
        method: 'DELETE',
      })
      
      set({ searchHistory: [] })
    } catch (err) {
      console.error('Error clearing history:', err)
    }
  },
  
  // Practice State (Local)
  practiceState: 'idle',
  setPracticeState: (state) => set({ practiceState: state }),
  callTimer: 240,
  setCallTimer: (time) => set({ callTimer: time }),
  
  // Quiz State
  quizState: 'idle',
  quizCurrentIndex: 0,
  quizScore: 0,
  quizQuestions: [],
  quizSettings: null,

  startQuiz: (settings) => {
    const { vocabulary } = get()
    let filtered = [...vocabulary]
    
    if (settings.category) {
      filtered = filtered.filter(v => v.categorySlug === settings.category)
    } else if (settings.setId) {
      // In a real app we'd filter by set, but for now let's just take random 10 if no set logic is fully implemented on server
      // Actually, we can just shuffle and take 10
    }

    // Shuffle and take 10
    const questions = filtered.sort(() => Math.random() - 0.5).slice(0, 10).map(word => {
      // Get 3 wrong options
      const otherWords = vocabulary.filter(v => v.id !== word.id)
      const wrongOptions = otherWords.sort(() => Math.random() - 0.5).slice(0, 3).map(v => v.bengali)
      const options = [word.bengali, ...wrongOptions].sort(() => Math.random() - 0.5)
      
      return {
        ...word,
        options,
        correctAnswer: word.bengali
      }
    })

    set({ 
      quizState: 'running', 
      quizQuestions: questions, 
      quizCurrentIndex: 0, 
      quizScore: 0,
      quizSettings: settings
    })
  },

  submitAnswer: (isCorrect) => {
    set((state) => {
      const nextIndex = state.quizCurrentIndex + 1
      const newScore = isCorrect ? state.quizScore + 1 : state.quizScore
      
      if (nextIndex >= state.quizQuestions.length) {
        return { 
          quizScore: newScore, 
          quizState: 'completed' 
        }
      }
      
      return { 
        quizScore: newScore, 
        quizCurrentIndex: nextIndex 
      }
    })
  },

  resetQuiz: () => set({ 
    quizState: 'idle', 
    quizCurrentIndex: 0, 
    quizScore: 0, 
    quizQuestions: [],
    quizSettings: null 
  }),

  // Streak System
  streak: 0,
  longestStreak: 0,
  totalXP: 0,
  studiedToday: false,
  streakBroken: false,

  fetchStreak: async () => {
    try {
      const response = await fetch('/api/user/streak')
      if (!response.ok) throw new Error('Failed to fetch streak')
      
      const data = await response.json()
      set({
        streak: data.streak,
        longestStreak: data.longestStreak,
        totalXP: data.totalXP,
        studiedToday: data.studiedToday,
        streakBroken: data.streakBroken,
      })
    } catch (err) {
      console.error('Error fetching streak:', err)
    }
  },

  updateStreak: async (xp = 10) => {
    try {
      const response = await fetch('/api/user/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp }),
      })
      
      if (!response.ok) throw new Error('Failed to update streak')
      
      const data = await response.json()
      set({
        streak: data.streak,
        longestStreak: data.longestStreak,
        totalXP: data.totalXP,
        studiedToday: true,
      })
    } catch (err) {
      console.error('Error updating streak:', err)
    }
  },
  
  // Fetch all user data
  fetchUserData: async () => {
    set({ isLoading: true, error: null })
    
    try {
      // 1. Vocabulary (Public)
      fetch('/api/vocabulary', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .then(data => data && set({ vocabulary: data.vocabulary || [] }))
        .catch(e => console.error('Vocab fetch failed:', e))

      // 2. Metadata (Public)
      fetch('/api/categories', { cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .then(data => data && set({ 
          categories: data.categories || [],
          vocabularySets: data.sets || []
        }))
        .catch(e => console.error('Metadata fetch failed:', e))

      // 3. User Data (Auth Required)
      fetch('/api/user/saved-words').then(res => res.ok ? res.json() : null)
        .then(data => data && set({ savedWordIds: data.savedWords || [] }))
        .catch(() => {})

      fetch('/api/user/notes').then(res => res.ok ? res.json() : null)
        .then(data => data && set({ notes: data.notes || [] }))
        .catch(() => {})

      fetch('/api/user/search-history').then(res => res.ok ? res.json() : null)
        .then(data => data && set({ searchHistory: data.history || [] }))
        .catch(() => {})

    } catch (err) {
      console.error('Error in fetchUserData:', err)
    } finally {
      // We don't wait for all fetches to finish before setting loading false 
      // in this async pattern, but that's okay for smoother UI.
      set({ isLoading: false })
    }
  },
}))
