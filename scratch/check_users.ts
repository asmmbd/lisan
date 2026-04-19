import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  const users = await prisma.user.findMany()
  console.log('Total users:', users.length)
  if (users.length > 0) {
    console.log('User IDs:', users.map(u => u.id))
  }
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
