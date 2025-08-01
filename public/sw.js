// Service Worker for Push Notifications
const CACHE_NAME = 'pathak-bhandar-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/search',
  '/products',
  '/manifest.json',
  '/api/logo',
  '/offline.html'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch(error => {
        console.warn('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    console.error('Error parsing push data:', error);
  }

  const title = data.title || 'Pathak Bhandar';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View Order',
        icon: '/logo.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo.png'
      }
    ],
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Fetch event - handle network requests with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external URLs
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Special handling for search API requests
  if (event.request.url.includes('/api/search')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful search responses for 5 minutes
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached search results if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to orders page
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes('pathakbhandar.in') && 'focus' in client) {
            client.focus();
            // Navigate to orders page
            client.postMessage({
              type: 'NAVIGATE_TO_ORDERS',
              orderId: event.notification.data?.orderId
            });
            return;
          }
        }
        
        // Open new window if app is not open
        if (self.clients.openWindow) {
          return self.clients.openWindow('/orders');
        }
      })
    );
  }
});

// Background sync event (for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders());
  }
});

// Helper function to sync orders when back online
async function syncOrders() {
  try {
    // This would sync any pending orders when connection is restored
    console.log('Syncing orders in background');
  } catch (error) {
    console.error('Failed to sync orders:', error);
  }
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event (for caching - optional)
self.addEventListener('fetch', (event) => {
  // Simple cache-first strategy for static assets
  if (event.request.destination === 'image' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});