import { prisma } from './prisma'

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@lisan.app'

// Lazy load web-push to avoid client-side bundling issues
let webPush: typeof import('web-push') | null = null

async function getWebPush() {
  if (!webPush) {
    const wp = await import('web-push')
    
    // Only initialize if we have valid keys (not during build)
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      wp.default.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
      )
    } else {
      console.warn('VAPID keys not configured. Push notifications will not work.')
    }
    
    webPush = wp.default
  }
  return webPush
}

export interface CallNotificationData {
  type: 'incoming_call' | 'match_found'
  roomId: string
  callerId?: string
  callerName?: string
  partnerId?: string
  partnerName?: string
  channelName?: string
  message?: string
}

export interface NotificationPayload {
  title: string
  body: string
  tag: string
  requireInteraction: boolean
  actions: Array<{ action: string; title: string }>
  data: CallNotificationData
  icon?: string
  badge?: string
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  notification: NotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (subscriptions.length === 0) {
      return { success: false, sent: 0, failed: 0 }
    }

    // Get web-push module
    const wp = await getWebPush()
    if (!wp) {
      return { success: false, sent: 0, failed: 0 }
    }

    // Send to all subscriptions
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
          await wp.sendNotification(
            pushSubscription,
            JSON.stringify(notification)
          )
          return { success: true, endpoint: sub.endpoint }
        } catch (error: any) {
          // If subscription is no longer valid, remove it
          if (error.statusCode === 404 || error.statusCode === 410) {
            await prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            })
          }
          return { success: false, endpoint: sub.endpoint, error: error.message }
        }
      })
    )

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as any).success
    ).length
    const failed = results.length - successful

    return { success: successful > 0, sent: successful, failed }
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return { success: false, sent: 0, failed: 0 }
  }
}

/**
 * Send incoming call notification to a user
 */
export async function sendCallNotification(
  receiverId: string,
  callData: {
    roomId: string
    callerId: string
    callerName: string
    channelName: string
  }
): Promise<{ success: boolean; sent: number; failed: number }> {
  const notification: NotificationPayload = {
    title: '📞 ইনকামিং কল',
    body: `${callData.callerName} আপনাকে কল করছে`,
    tag: `call-${callData.roomId}`,
    requireInteraction: true,
    actions: [
      { action: 'accept', title: 'গ্রহণ করুন' },
      { action: 'decline', title: 'প্রত্যাখ্যান করুন' },
    ],
    data: {
      type: 'incoming_call',
      roomId: callData.roomId,
      callerId: callData.callerId,
      callerName: callData.callerName,
      channelName: callData.channelName,
    },
    icon: '/logo.png',
    badge: '/logo.png',
  }

  return sendPushToUser(receiverId, notification)
}

/**
 * Send match found notification to a user
 */
export async function sendMatchNotification(
  userId: string,
  matchData: {
    matchId: string
    roomId: string
    partnerId: string
    partnerName: string
    channelName: string
  }
): Promise<{ success: boolean; sent: number; failed: number }> {
  const notification: NotificationPayload = {
    title: '🎉 পার্টনার পাওয়া গেছে!',
    body: `${matchData.partnerName} এর সাথে ম্যাচ হয়েছে`,
    tag: `match-${matchData.matchId}`,
    requireInteraction: true,
    actions: [
      { action: 'join', title: 'যোগ দিন' },
      { action: 'dismiss', title: 'বাদ দিন' },
    ],
    data: {
      type: 'match_found',
      roomId: matchData.roomId,
      partnerId: matchData.partnerId,
      partnerName: matchData.partnerName,
      channelName: matchData.channelName,
    },
    icon: '/logo.png',
    badge: '/logo.png',
  }

  return sendPushToUser(userId, notification)
}
