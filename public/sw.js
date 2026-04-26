const CACHE_VERSION = 'lisan-pwa-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = '/offline';

const APP_SHELL_URLS = [
  '/',
  '/practice',
  '/practice/quiz',
  '/dictionary',
  '/saved',
  '/profile',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function shouldHandleRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;

  if (url.pathname.startsWith('/api/auth')) return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname.startsWith('/_next/webpack-hmr')) return false;

  return true;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!shouldHandleRequest(request)) return;

  const acceptHeader = request.headers.get('accept') || '';
  const isDocument = request.mode === 'navigate' || acceptHeader.includes('text/html');

  if (isDocument) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// ==================== PUSH NOTIFICATIONS ====================

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'লিসান';
  const options = {
    body: data.body || 'নতুন নোটিফিকেশন',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data;
  
  // Handle action buttons first
  if (event.action) {
    // Handle accept/join action
    if ((event.action === 'accept' || event.action === 'join') && notificationData.roomId) {
      const url = `/room/${notificationData.roomId}?autoJoin=true`;
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          // If app is already open, focus and navigate
          for (const client of clientList) {
            if ('focus' in client) {
              client.postMessage({ type: 'navigate', url });
              return client.focus();
            }
          }
          // Otherwise open new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
      );
      return;
    }
    
    // Handle decline/dismiss action - just close notification (already closed above)
    if (event.action === 'decline' || event.action === 'dismiss') {
      // Notify server that call was declined
      if (notificationData.roomId) {
        event.waitUntil(
          fetch('/api/calls/decline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: notificationData.roomId }),
          }).catch(() => {})
        );
      }
      return;
    }
  }

  // Default: navigate based on notification type (click on notification body)
  let url = '/';
  if (notificationData.type === 'call' || notificationData.type === 'incoming_call') {
    url = `/room/${notificationData.roomId}?autoJoin=true`;
  } else if (notificationData.type === 'match' || notificationData.type === 'match_found') {
    url = `/room/${notificationData.roomId}?autoJoin=true`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-calls') {
    event.waitUntil(syncPendingCalls());
  }
});

async function syncPendingCalls() {
  // Sync any pending call actions when back online
  const cache = await caches.open('pending-calls');
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      await fetch(request);
      await cache.delete(request);
    } catch (error) {
      console.error('Failed to sync call:', error);
    }
  }
}
