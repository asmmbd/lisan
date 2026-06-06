/***************
 * Shared domain types for the Lisan app.
 *
 * These mirror the Prisma schema in `prisma/schema.prisma` so that
 * client-side state (Zustand store) and components get proper typing
 * without depending on `@prisma/client` (which would bundle the client
 * into the browser).
 */

export type Vocabulary = {
  id: string
  arabic: string
  bengali: string
  pronunciation: string
  example: string | null
  exampleTranslation: string | null
  categorySlug: string
  createdAt: Date | string
  updatedAt: Date | string
}

export type Category = {
  id: string
  slug: string
  title: string
  icon: string | null
  gradient: string | null
  createdAt: Date | string
  /** Populated by /api/categories (count of words in category). */
  wordCount?: number
}

export type VocabularySet = {
  id: string
  title: string
  icon: string | null
  total: number
  category: string | null
  createdAt: Date | string
}

export type QuizDirection = 'ar_to_bn' | 'bn_to_ar'

/***************
 * A quiz question is a Vocabulary word augmented with multiple-choice
 * options, the correct answer, and the direction it tests.
 */
export type QuizQuestion = {
  id: string
  arabic: string
  bengali: string
  pronunciation: string
  example?: string | null
  exampleTranslation?: string | null
  categorySlug?: string
  options: string[]
  correctAnswer: string
  direction: QuizDirection
  promptText: string
  questionText: string
  helperText?: string
}

export type Note = {
  id: string
  text: string
  createdAt: string
}

export type UserProfile = {
  id: string
  name: string | null
  email: string
  image: string | null
}
