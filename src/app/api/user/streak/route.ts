import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Get user's streak data
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        streak: true,
        lastStudyDate: true,
        longestStreak: true,
        totalXP: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if streak is still valid
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let currentStreak = user.streak
    let streakBroken = false

    if (user.lastStudyDate) {
      const lastStudy = new Date(user.lastStudyDate)
      const lastStudyDay = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate())

      // If last study was before yesterday, streak is broken
      if (lastStudyDay < yesterday) {
        currentStreak = 0
        streakBroken = true
        // Update user streak to 0
        await prisma.user.update({
          where: { id: session.user.id },
          data: { streak: 0 },
        })
      }
    } else {
      currentStreak = 0
    }

    // Check if studied today
    const studiedToday = user.lastStudyDate
      ? new Date(user.lastStudyDate).toDateString() === today.toDateString()
      : false

    return NextResponse.json({
      streak: currentStreak,
      longestStreak: user.longestStreak,
      totalXP: user.totalXP,
      lastStudyDate: user.lastStudyDate,
      studiedToday,
      streakBroken,
    })
  } catch (error) {
    console.error('Error fetching streak:', error)
    return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 })
  }
}

// Update streak when user studies
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { xp = 10 } = await req.json()

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        streak: true,
        lastStudyDate: true,
        longestStreak: true,
        totalXP: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let newStreak = user.streak
    let studiedToday = false

    // Check if already studied today
    if (user.lastStudyDate) {
      const lastStudy = new Date(user.lastStudyDate)
      const lastStudyDay = new Date(lastStudy.getFullYear(), lastStudy.getMonth(), lastStudy.getDate())

      if (lastStudyDay.toDateString() === today.toDateString()) {
        // Already studied today, just add XP
        studiedToday = true
      } else if (lastStudyDay.toDateString() === yesterday.toDateString()) {
        // Studied yesterday, increase streak
        newStreak = user.streak + 1
      } else {
        // Streak broken, start fresh
        newStreak = 1
      }
    } else {
      // First time studying
      newStreak = 1
    }

    // Update longest streak if needed
    const newLongestStreak = Math.max(user.longestStreak, newStreak)
    const newTotalXP = user.totalXP + xp

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        streak: newStreak,
        lastStudyDate: now,
        longestStreak: newLongestStreak,
        totalXP: newTotalXP,
      },
    })

    return NextResponse.json({
      streak: newStreak,
      longestStreak: newLongestStreak,
      totalXP: newTotalXP,
      studiedToday,
      xpEarned: studiedToday ? 0 : xp,
    })
  } catch (error) {
    console.error('Error updating streak:', error)
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 })
  }
}
