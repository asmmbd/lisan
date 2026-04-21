export type QuizLevel = 'beginner' | 'intermediate' | 'advanced'

interface VocabularyLike {
  arabic?: string
  bengali?: string
  pronunciation?: string
  example?: string | null
  exampleTranslation?: string | null
}

export function getVocabularyLevel(word: VocabularyLike): QuizLevel {
  const arabicLength = word.arabic?.trim().length ?? 0
  const bengaliLength = word.bengali?.trim().length ?? 0
  const pronunciationWords = word.pronunciation?.trim().split(/\s+/).filter(Boolean).length ?? 0
  const hasExample = Boolean(word.example || word.exampleTranslation)
  const exampleLength = (word.example?.trim().length ?? 0) + (word.exampleTranslation?.trim().length ?? 0)

  let complexityScore = 0
  complexityScore += arabicLength
  complexityScore += Math.ceil(bengaliLength / 2)
  complexityScore += pronunciationWords * 2
  complexityScore += hasExample ? 4 : 0
  complexityScore += Math.ceil(exampleLength / 20)

  if (complexityScore <= 10) return 'beginner'
  if (complexityScore <= 18) return 'intermediate'
  return 'advanced'
}

export function getQuizQuestionCount(level?: QuizLevel) {
  if (level === 'beginner') return 8
  if (level === 'advanced') return 12
  return 10
}
