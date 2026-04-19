import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDb() {
  const categories = await prisma.category.findMany()
  const vocab = await prisma.vocabulary.findMany()
  const sets = await prisma.vocabularySet.findMany()

  console.log('Categories count:', categories.length)
  console.log('Vocabulary count:', vocab.length)
  console.log('Sets count:', sets.length)

  if (categories.length > 0) {
    console.log('Categories slugs:', categories.map(c => c.slug))
  }
}

checkDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
