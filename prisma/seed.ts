import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { slug: 'quranic', title: 'কোরআনিক শব্দ', icon: '📖', gradient: 'from-emerald-600 to-green-700' },
  { slug: 'hadith', title: 'হাদিসের শব্দ', icon: '📿', gradient: 'from-green-600 to-teal-700' },
  { slug: 'daily', title: 'দৈনন্দিন শব্দ', icon: '🏠', gradient: 'from-teal-500 to-emerald-600' },
  { slug: 'sports', title: 'খেলাধুলা', icon: '⚽', gradient: 'from-green-500 to-lime-600' },
  { slug: 'study', title: 'পড়াশোনা', icon: '📚', gradient: 'from-emerald-500 to-green-600' },
  { slug: 'travel', title: 'ভ্রমণ', icon: '✈️', gradient: 'from-teal-600 to-green-500' },
  { slug: 'food', title: 'খাবার', icon: '🍽️', gradient: 'from-lime-500 to-green-600' },
  { slug: 'family', title: 'পরিবার', icon: '👨‍👩‍👧‍👦', gradient: 'from-green-600 to-emerald-500' },
]

const vocabularyWords = [
  // Quranic words
  { id: '1', arabic: 'كِتَابٌ', bengali: 'কিতাব / বই', pronunciation: 'kitaabun', example: 'هَذَا كِتَابٌ مُبِينٌ', exampleTranslation: 'এটি একটি স্পষ্ট কিতাব', categorySlug: 'quranic' },
  { id: '2', arabic: 'رَحْمَةٌ', bengali: 'রহমত / করুণা', pronunciation: 'rahmatun', example: 'رَحْمَةُ اللَّهِ قَرِيبٌ', exampleTranslation: 'আল্লাহর রহমত নিকটে', categorySlug: 'quranic' },
  { id: '3', arabic: 'إِيمَانٌ', bengali: 'ঈমান / বিশ্বাস', pronunciation: 'eemaanun', example: 'الإِيمَانُ فِي الْقَلْبِ', exampleTranslation: 'ঈমান অন্তরে থাকে', categorySlug: 'quranic' },
  { id: '4', arabic: 'صَلَاةٌ', bengali: 'সালাত / নামাজ', pronunciation: 'salaatun', example: 'أَقِمِ الصَّلَاةَ', exampleTranslation: 'সালাত কায়েম করো', categorySlug: 'quranic' },
  { id: '5', arabic: 'جَنَّةٌ', bengali: 'জান্নাত / স্বর্গ', pronunciation: 'jannatun', example: 'جَنَّاتٌ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ', exampleTranslation: 'জান্নাত যার পাদদেশ দিয়ে নদী প্রবাহিত', categorySlug: 'quranic' },

  // Hadith words
  { id: '6', arabic: 'حَدِيثٌ', bengali: 'হাদিস / বর্ণনা', pronunciation: 'hadeethun', example: 'قَالَ رَسُولُ اللَّهِ', exampleTranslation: 'রাসূলুল্লাহ বলেছেন', categorySlug: 'hadith' },
  { id: '7', arabic: 'سُنَّةٌ', bengali: 'সুন্নাত / প্রথা', pronunciation: 'sunnatun', example: 'اتَّبِعْ سُنَّتِي', exampleTranslation: 'আমার সুন্নাত অনুসরণ করো', categorySlug: 'hadith' },
  { id: '8', arabic: 'عِلْمٌ', bengali: 'ইলম / জ্ঞান', pronunciation: 'ilmun', example: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ', exampleTranslation: 'জ্ঞান অর্জন করা ফরজ', categorySlug: 'hadith' },
  { id: '9', arabic: 'صَبْرٌ', bengali: 'সবর / ধৈর্য', pronunciation: 'sabrun', example: 'الصَّبْرُ مِفْتَاحُ الْفَرَجِ', exampleTranslation: 'ধৈর্য মুক্তির চাবিকাঠি', categorySlug: 'hadith' },
  { id: '10', arabic: 'شُكْرٌ', bengali: 'শুকর / কৃতজ্ঞতা', pronunciation: 'shukrun', example: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', exampleTranslation: 'তোমরা শুকর করলে আমি তোমাদের আরো বাড়িয়ে দেব', categorySlug: 'hadith' },

  // Daily words
  { id: '11', arabic: 'سَلَامٌ', bengali: 'সালাম / শান্তি', pronunciation: 'salaamun', example: 'السَّلَامُ عَلَيْكُمْ', exampleTranslation: 'আসসালামু আলাইকুম', categorySlug: 'daily' },
  { id: '12', arabic: 'مَاءٌ', bengali: 'পানি', pronunciation: 'maaun', example: 'أُرِيدُ مَاءً', exampleTranslation: 'আমি পানি চাই', categorySlug: 'daily' },
  { id: '13', arabic: 'طَعَامٌ', bengali: 'খাবার', pronunciation: "ta'aamun", example: 'هَلْ عِندَكَ طَعَامٌ؟', exampleTranslation: 'তোমার কাছে খাবার আছে?', categorySlug: 'daily' },
  { id: '14', arabic: 'بَيْتٌ', bengali: 'ঘর / বাড়ি', pronunciation: 'baytun', example: 'ذَهَبْتُ إِلَى الْبَيْتِ', exampleTranslation: 'আমি বাড়িতে গেছি', categorySlug: 'daily' },
  { id: '15', arabic: 'وَقْتٌ', bengali: 'সময়', pronunciation: 'waqtun', example: 'مَا الْوَقْتُ؟', exampleTranslation: 'কয়টা বাজে?', categorySlug: 'daily' },

  // Sports words
  { id: '16', arabic: 'لُعْبَةٌ', bengali: 'খেলা', pronunciation: "lu'batun", example: 'هَذِهِ لُعْبَةٌ جَمِيلَةٌ', exampleTranslation: 'এটি একটি সুন্দর খেলা', categorySlug: 'sports' },
  { id: '17', arabic: 'فَرِيقٌ', bengali: 'দল', pronunciation: 'fareequn', example: 'فَرِيقُنَا فَازَ', exampleTranslation: 'আমাদের দল জিতেছে', categorySlug: 'sports' },
  { id: '18', arabic: 'جَرْيٌ', bengali: 'দৌড়', pronunciation: 'jaryun', example: 'أُحِبُّ الْجَرْيَ', exampleTranslation: 'আমি দৌড়াতে ভালোবাসি', categorySlug: 'sports' },

  // Study words
  { id: '19', arabic: 'مَدْرَسَةٌ', bengali: 'মাদরাসা / স্কুল', pronunciation: 'madrasatun', example: 'ذَهَبْتُ إِلَى الْمَدْرَسَةِ', exampleTranslation: 'আমি মাদরাসায় গেছি', categorySlug: 'study' },
  { id: '20', arabic: 'مُعَلِّمٌ', bengali: 'শিক্ষক / উস্তাদ', pronunciation: "mu'allimun", example: 'الْمُعَلِّمُ جَدِيدٌ', exampleTranslation: 'শিক্ষক নতুন', categorySlug: 'study' },
  { id: '21', arabic: 'دَرْسٌ', bengali: 'পাঠ / দরস', pronunciation: 'darsun', example: 'هَذَا الدَّরْسُ مُফীদٌ', exampleTranslation: 'এই দরসটি উপকারী', categorySlug: 'study' },

  // Travel words
  { id: '22', arabic: 'سَفَرٌ', bengali: 'সফর / ভ্রমণ', pronunciation: 'safarun', example: 'السَّﻔَرُ مُتْعِبٌ', exampleTranslation: 'সফর ক্লান্তিকর', categorySlug: 'travel' },
  { id: '23', arabic: 'طَرِيقٌ', bengali: 'রাস্তা', pronunciation: 'tareequn', example: 'هَذَا الطَّרِيقُ طَوِيلٌ', exampleTranslation: 'এই রাস্তাটি দীর্ঘ', categorySlug: 'travel' },

  // Food words
  { id: '24', arabic: 'خُبْزٌ', bengali: 'রুটি', pronunciation: 'khubzun', example: 'أُرِيدُ خُبْزًا', exampleTranslation: 'আমি রুটি চাই', categorySlug: 'food' },
  { id: '25', arabic: 'لَبَنٌ', bengali: 'দুধ', pronunciation: 'labanun', example: 'اللَّﺑَنُ صِحِّيٌّ', exampleTranslation: 'দুধ স্বাস্থ্যকর', categorySlug: 'food' },

  // Family words
  { id: '26', arabic: 'أُسْرَةٌ', bengali: 'পরিবার', pronunciation: 'usratun', example: 'أُسْرَتِي كَبِيرَةٌ', exampleTranslation: 'আমার পরিবার বড়', categorySlug: 'family' },
  { id: '27', arabic: 'وَالِدٌ', bengali: 'পিতা', pronunciation: 'waalidun', example: 'وَالِدِي فِي الْبَيْتِ', exampleTranslation: 'আমার পিতা বাড়িতে', categorySlug: 'family' },
  { id: '28', arabic: 'أُمٌّ', bengali: 'মাতা', pronunciation: 'ummun', example: 'أُمِّي حَنُونٌ', exampleTranslation: 'আমার মাতা স্নেহশীলা', categorySlug: 'family' },
]

const vocabularySets = [
  { id: 'daily100', title: 'দৈনন্দিন ১০০ শব্দ', icon: '🏠', total: 100, category: 'daily', wordIds: ['11', '12', '13', '14', '15'] },
  { id: 'sports100', title: 'খেলাধুলা ১০০ শব্দ', icon: '⚽', total: 100, category: 'sports', wordIds: ['16', '17', '18'] },
  { id: 'study100', title: 'পড়াশোনা ১০০ শব্দ', icon: '📚', total: 100, category: 'study', wordIds: ['19', '20', '21'] },
  { id: 'travel100', title: 'ভ্রমণ ১০০ শব্দ', icon: '✈️', total: 100, category: 'travel', wordIds: ['22', '23'] },
  { id: 'food100', title: 'খাবার ১০০ শব্দ', icon: '🍽️', total: 100, category: 'food', wordIds: ['24', '25'] },
  { id: 'family100', title: 'পরিবার ১০০ শব্দ', icon: '👨‍👩‍👧‍👦', total: 100, category: 'family', wordIds: ['26', '27', '28'] },
]

async function main() {
  console.log('Seeding categories...')
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        title: cat.title,
        icon: cat.icon,
        gradient: cat.gradient,
      },
      create: {
        slug: cat.slug,
        title: cat.title,
        icon: cat.icon,
        gradient: cat.gradient,
      },
    })
  }

  console.log('Seeding vocabulary...')
  for (const word of vocabularyWords) {
    await prisma.vocabulary.upsert({
      where: { id: word.id },
      update: {
        arabic: word.arabic,
        bengali: word.bengali,
        pronunciation: word.pronunciation,
        example: word.example,
        exampleTranslation: word.exampleTranslation,
        categorySlug: word.categorySlug,
      },
      create: {
        id: word.id,
        arabic: word.arabic,
        bengali: word.bengali,
        pronunciation: word.pronunciation,
        example: word.example,
        exampleTranslation: word.exampleTranslation,
        categorySlug: word.categorySlug,
      },
    })
  }

  console.log('Seeding vocabulary sets...')
  for (const set of vocabularySets) {
    await prisma.vocabularySet.upsert({
      where: { id: set.id },
      update: {
        title: set.title,
        icon: set.icon,
        total: set.total,
        category: set.category,
        words: {
          set: set.wordIds.map(id => ({ id }))
        }
      },
      create: {
        id: set.id,
        title: set.title,
        icon: set.icon,
        total: set.total,
        category: set.category,
        words: {
          connect: set.wordIds.map(id => ({ id }))
        }
      },
    })
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
