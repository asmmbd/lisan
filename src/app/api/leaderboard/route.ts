import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    const users = await prisma.user.findMany({
      orderBy: [
        { totalXP: 'desc' },
        { streak: 'desc' },
        { updatedAt: 'asc' },
      ],
      take: 20,
      select: {
        id: true,
        name: true,
        image: true,
        totalXP: true,
        streak: true,
        _count: {
          select: {
            savedWords: true,
          },
        },
      },
    })

    let currentUser: null | {
      id: string
      name: string | null
      image: string | null
      totalXP: number
      streak: number
      savedWordsCount: number
      rank: number
    } = null

    if (session?.user?.id) {
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          image: true,
          totalXP: true,
          streak: true,
          _count: {
            select: {
              savedWords: true,
            },
          },
        },
      })

      if (me) {
        const higherRankCount = await prisma.user.count({
          where: {
            OR: [
              { totalXP: { gt: me.totalXP } },
              {
                totalXP: me.totalXP,
                streak: { gt: me.streak },
              },
            ],
          },
        })

        currentUser = {
          id: me.id,
          name: me.name,
          image: me.image,
          totalXP: me.totalXP,
          streak: me.streak,
          savedWordsCount: me._count.savedWords,
          rank: higherRankCount + 1,
        }
      }
    }

    return NextResponse.json({
      leaders: users.map((user, index) => ({
        id: user.id,
        name: user.name,
        image: user.image,
        totalXP: user.totalXP,
        streak: user.streak,
        savedWordsCount: user._count.savedWords,
        rank: index + 1,
      })),
      currentUser,
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
