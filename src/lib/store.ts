import { create } from 'zustand'

export type TabType = 'home' | 'dictionary' | 'practice' | 'saved' | 'profile'

interface Note {
  id: string
  text: string
  createdAt: string
}

interface AppState {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
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
}

export const useAppStore = create<AppState>((set, get) => ({
  // UI State
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
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
