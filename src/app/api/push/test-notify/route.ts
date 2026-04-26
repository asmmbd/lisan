import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import webPush from 'web-push'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@lisan.app'

// Only initialize web-push if keys are available (skip during build)
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: session.user.id },
    })

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found. Please enable notifications first.' },
        { status: 404 }
      )
    }

    const testNotification = {
      title: 'লিসান - টেস্ট নোটিফিকেশন',
      body: 'পুশ নোটিফিকেশন সফলভাবে কাজ করছে! 🎉',
      tag: 'test',
      requireInteraction: false,
      data: {
        type: 'test',
        url: '/practice',
      },
    }

    // Send test notification
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webPush.sendNotification(
            pushSubscription,
            JSON.stringify(testNotification)
          )
          return { success: true, endpoint: sub.endpoint }
        } catch (error: any) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            })
          }
          return { success: false, endpoint: sub.endpoint, error: error.message }
        }
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      results,
    })
  } catch (error) {
    console.error('Failed to send test notification:', error)
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    )
  }
}
