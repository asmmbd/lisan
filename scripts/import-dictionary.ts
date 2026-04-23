import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DICTIONARY_API_URL = 'http://localhost:3000/words'

// Parse meaning field to extract pronunciation and Bengali meaning
function parseMeaning(meaning: string): { pronunciation: string; bengali: string } {
  // Pattern: [pronunciation] meaning1, meaning2, ...
  const match = meaning.match(/^\[([^\]]+)\]\s*(.+)$/)
  
  if (match) {
    return {
      pronunciation: match[1].trim(),
      bengali: match[2].trim()
    }
  }
  
  // If no pronunciation pattern found, return empty pronunciation and full meaning as Bengali
  return {
    pronunciation: '',
    bengali: meaning
  }
}

// Clean Arabic word (remove extra forms and root info for simple display)
function cleanArabic(arabic: string): string {
  // Remove content in parentheses and brackets for main word
  return arabic
    .replace(/\s*\([^)]*\)\s*/g, ' ')  // Remove (content)
    .replace(/\s*\[[^\]]*\]\s*/g, ' ')  // Remove [content]
    .replace(/\s+/g, ' ')                  // Normalize spaces
    .trim()
}

async function importDictionaryWords(page = 1, limit = 100) {
  console.log(`Fetching page ${page} (limit: ${limit})...`)
  
  try {
    const response = await fetch(`${DICTIONARY_API_URL}?page=${page}&limit=${limit}`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success || !data.data || data.data.length === 0) {
      console.log('No more words to import.')
      return { count: 0, hasMore: false }
    }
    
    let importedCount = 0
    
    for (const word of data.data) {
      const { pronunciation, bengali } = parseMeaning(word.meaning)
      const cleanWord = cleanArabic(word.arabic)
      
      // Skip if no valid Arabic word
      if (!cleanWord || cleanWord.length === 0) {
        console.log(`Skipping word ${word.id}: No valid Arabic text`)
        continue
      }
      
      try {
        await prisma.vocabulary.upsert({
          where: { id: `dict_${word.id}` },
          update: {
            arabic: cleanWord,
            bengali: bengali,
            pronunciation: pronunciation,
            categorySlug: 'dictionary',
          },
          create: {
            id: `dict_${word.id}`,
            arabic: cleanWord,
            bengali: bengali,
            pronunciation: pronunciation,
            categorySlug: 'dictionary',
            example: word.arabic, // Store original Arabic with forms
          },
        })
        importedCount++
        console.log(`Imported: ${cleanWord} - ${bengali.substring(0, 50)}...`)
      } catch (err) {
        console.error(`Failed to import word ${word.id}:`, err)
      }
    }
    
    return { 
      count: importedCount, 
      hasMore: data.pagination?.hasNext || false,
      totalPages: data.pagination?.totalPages || 0
    }
    
  } catch (error) {
    console.error('Error fetching dictionary:', error)
    return { count: 0, hasMore: false }
  }
}

async function main() {
  console.log('Starting dictionary import...')
  
  // Ensure dictionary category exists
  await prisma.category.upsert({
    where: { slug: 'dictionary' },
    update: {
      title: 'Dictionary শব্দ',
      icon: '📚',
      gradient: 'from-blue-500 to-indigo-600',
    },
    create: {
      slug: 'dictionary',
      title: 'Dictionary শব্দ',
      icon: '📚',
      gradient: 'from-blue-500 to-indigo-600',
    },
  })
  
  console.log('Dictionary category ready.')
  
  // Import words in batches
  let page = 1
  const limit = 100
  let totalImported = 0
  let hasMore = true
  let totalPages = 0
  
  console.log('Starting import of all dictionary words...')
  console.log('This may take several minutes...\n')
  
  while (hasMore) {
    const result = await importDictionaryWords(page, limit)
    totalImported += result.count
    hasMore = result.hasMore
    
    if (result.totalPages > 0 && totalPages === 0) {
      totalPages = result.totalPages
    }
    
    const progress = totalPages > 0 ? Math.round((page / totalPages) * 100) : 0
    console.log(`Page ${page}/${totalPages || '?'} (${progress}%) - Imported: ${result.count} words | Total: ${totalImported}`)
    
    if (hasMore) {
      page++
      // Small delay to not overwhelm the API
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  console.log(`\n✅ Import complete! Total words imported: ${totalImported}`)
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
