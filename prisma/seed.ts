import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const vocabularyWords = [
  // Quranic words
  { id: '1', arabic: 'كِتَابٌ', bengali: 'কিতাব / বই', pronunciation: 'kitaabun', example: 'هَذَا كِتَابٌ مُبِينٌ', exampleTranslation: 'এটি একটি স্পষ্ট কিতাব', category: 'quranic' },
  { id: '2', arabic: 'رَحْمَةٌ', bengali: 'রহমত / করুণা', pronunciation: 'rahmatun', example: 'رَحْمَةُ اللَّهِ قَرِيبٌ', exampleTranslation: 'আল্লাহর রহমত নিকটে', category: 'quranic' },
  { id: '3', arabic: 'إِيمَانٌ', bengali: 'ঈমান / বিশ্বাস', pronunciation: 'eemaanun', example: 'الإِيمَانُ فِي الْقَلْبِ', exampleTranslation: 'ঈমান অন্তরে থাকে', category: 'quranic' },
  { id: '4', arabic: 'صَلَاةٌ', bengali: 'সালাত / নামাজ', pronunciation: 'salaatun', example: 'أَقِمِ الصَّلَاةَ', exampleTranslation: 'সালাত কায়েম করো', category: 'quranic' },
  { id: '5', arabic: 'جَنَّةٌ', bengali: 'জান্নাত / স্বর্গ', pronunciation: 'jannatun', example: 'جَنَّاتٌ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ', exampleTranslation: 'জান্নাত যার পাদদেশ দিয়ে নদী প্রবাহিত', category: 'quranic' },

  // Hadith words
  { id: '6', arabic: 'حَدِيثٌ', bengali: 'হাদিস / বর্ণনা', pronunciation: 'hadeethun', example: 'قَالَ رَسُولُ اللَّهِ', exampleTranslation: 'রাসূলুল্লাহ বলেছেন', category: 'hadith' },
  { id: '7', arabic: 'سُنَّةٌ', bengali: 'সুন্নাত / প্রথা', pronunciation: 'sunnatun', example: 'اتَّبِعْ সُنَّتِي', exampleTranslation: 'আমার সুন্নাত অনুসরণ করো', category: 'hadith' },
  { id: '8', arabic: 'عِلْمٌ', bengali: 'ইলম / জ্ঞান', pronunciation: 'ilmun', example: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ', exampleTranslation: 'জ্ঞান অর্জন করা ফরজ', category: 'hadith' },
  { id: '9', arabic: 'صَبْرٌ', bengali: 'সবর / ধৈর্য', pronunciation: 'sabrun', example: 'الصَّبْرُ مِفْتَاحُ الْفَرَجِ', exampleTranslation: 'ধৈর্য মুক্তির চাবিকাঠি', category: 'hadith' },
  { id: '10', arabic: 'شُكْرٌ', bengali: 'শুকর / কৃতজ্ঞতা', pronunciation: 'shukrun', example: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', exampleTranslation: 'তোমরা শুকর করলে আমি তোমাদের আরো বাড়িয়ে দেব', category: 'hadith' },

  // Daily words
  { id: '11', arabic: 'سَلَامٌ', bengali: 'সালাম / শান্তি', pronunciation: 'salaamun', example: 'السَّلَامُ عَلَيْكُمْ', exampleTranslation: 'আসসালামু আলাইকুম', category: 'daily' },
  { id: '12', arabic: 'مَاءٌ', bengali: 'পানি', pronunciation: 'maaun', example: 'أُرِيدُ مَاءً', exampleTranslation: 'আমি পানি চাই', category: 'daily' },
  { id: '13', arabic: 'طَعَامٌ', bengali: 'খাবার', pronunciation: "ta'aamun", example: 'هَلْ عِندَكَ طَعَامٌ؟', exampleTranslation: 'তোমার কাছে খাবার আছে?', category: 'daily' },
  { id: '14', arabic: 'بَيْتٌ', bengali: 'ঘর / বাড়ি', pronunciation: 'baytun', example: 'ذَهَبْتُ إِلَى الْبَيْتِ', exampleTranslation: 'আমি বাড়িতে গেছি', category: 'daily' },
  { id: '15', arabic: 'وَقْتٌ', bengali: 'সময়', pronunciation: 'waqtun', example: 'مَا الْوَقْتُ؟', exampleTranslation: 'কয়টা বাজে?', category: 'daily' },

  // Sports words
  { id: '16', arabic: 'لُعْبَةٌ', bengali: 'খেলা', pronunciation: "lu'batun", example: 'هَذِهِ لُعْبَةٌ جَمِيلَةٌ', exampleTranslation: 'এটি একটি সুন্দর খেলা', category: 'sports' },
  { id: '17', arabic: 'فَرِيقٌ', bengali: 'দল', pronunciation: 'fareequn', example: 'فَرِيقُنَا فَازَ', exampleTranslation: 'আমাদের দল জিতেছে', category: 'sports' },
  { id: '18', arabic: 'جَرْইٌ', bengali: 'দৌড়', pronunciation: 'jaryun', example: 'أُحِبُّ الْجَرْيَ', exampleTranslation: 'আমি দৌড়াতে ভালোবাসি', category: 'sports' },

  // Study words
  { id: '19', arabic: 'مَدْرَسَةٌ', bengali: 'মাদরাসা / স্কুল', pronunciation: 'madrasatun', example: 'ذَهَبْتُ إِلَى الْمَدْرَسَةِ', exampleTranslation: 'আমি মাদরাসায় গেছি', category: 'study' },
  { id: '20', arabic: 'مُعَلِّمٌ', bengali: 'শিক্ষক / উস্তাদ', pronunciation: "mu'allimun", example: 'الْمُعَلِّمُ جَدِيدٌ', exampleTranslation: 'শিক্ষক নতুন', category: 'study' },
  { id: '21', arabic: 'دَرْسٌ', bengali: 'পাঠ / দরস', pronunciation: 'darsun', example: 'هَذَا الدَّরْسُ مُفِيدٌ', exampleTranslation: 'এই দরসটি উপকারী', category: 'study' },

  // Travel words
  { id: '22', arabic: 'سَفَرٌ', bengali: 'সফর / ভ্রমণ', pronunciation: 'safarun', example: 'السَّﻔَرُ مُتْعِبٌ', exampleTranslation: 'সফর ক্লান্তিকর', category: 'travel' },
  { id: '23', arabic: 'طَرِيقٌ', bengali: 'রাস্তা', pronunciation: 'tareequn', example: 'هَذَا الطَّרِيقُ طَوِيلٌ', exampleTranslation: 'এই রাস্তাটি দীর্ঘ', category: 'travel' },

  // Food words
  { id: '24', arabic: 'خُبْزٌ', bengali: 'রুটি', pronunciation: 'khubzun', example: 'أُرِيدُ خُبْزًا', exampleTranslation: 'আমি রুটি চাই', category: 'food' },
  { id: '25', arabic: 'لَبَنٌ', bengali: 'দুধ', pronunciation: 'labanun', example: 'اللَّﺑَنُ صِحِّيٌّ', exampleTranslation: 'দুধ স্বাস্থ্যকর', category: 'food' },

  // Family words
  { id: '26', arabic: 'أُسْرَةٌ', bengali: 'পরিবার', pronunciation: 'usratun', example: 'أُسْرَتِي كَبِيرَةٌ', exampleTranslation: 'আমার পরিবার বড়', category: 'family' },
  { id: '27', arabic: 'وَالِدٌ', bengali: 'পিতা', pronunciation: 'waalidun', example: 'وَالِدِي فِي الْبَيْتِ', exampleTranslation: 'আমার পিতা বাড়িতে', category: 'family' },
  { id: '28', arabic: 'أُمٌّ', bengali: 'মাতা', pronunciation: 'ummun', example: 'أُمِّي حَنُونٌ', exampleTranslation: 'আমার মাতা স্নেহশীলা', category: 'family' },
]

async function main() {
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
        category: word.category,
      },
      create: {
        id: word.id,
        arabic: word.arabic,
        bengali: word.bengali,
        pronunciation: word.pronunciation,
        example: word.example,
        exampleTranslation: word.exampleTranslation,
        category: word.category,
      },
    })
  }
  console.log(`Seeded ${vocabularyWords.length} words.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
