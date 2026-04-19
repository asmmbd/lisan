import * as PusherClientModule from 'pusher-js'

// Client-side Pusher constructor
const PusherClient = (PusherClientModule as any).default?.Pusher || (PusherClientModule as any).Pusher || (PusherClientModule as any).default || PusherClientModule

// Client-side Pusher (for subscriptions in components)
export const pusherClient = new (PusherClient as any)(
  process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    forceTLS: true,
  }
)

/**
 * Server-side Pusher Trigger
 * Using a dynamic import inside the function ensures this code only runs
 * and is bundled for the server-side, avoiding issues with Next.js build.
 */
export async function pusherTrigger(channel: string, event: string, data: any) {
  if (typeof window !== 'undefined') {
    throw new Error('pusherTrigger can only be called on the server')
  }

  // Import the server-side Pusher package
  const PusherModule = await import('pusher')
  const Pusher = (PusherModule as any).default?.Pusher || (PusherModule as any).Pusher || (PusherModule as any).default || PusherModule
  
  const pusherServer = new (Pusher as any)({
    appId: process.env.PUSHER_APP_ID || '',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
    secret: process.env.PUSHER_SECRET || '',
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2',
    useTLS: true,
  })

  return pusherServer.trigger(channel, event, data)
}
