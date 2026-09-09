// Only cache the generic offline page and its logo. Clinic/API data stays online.
const OFFLINE_CACHE = 'dentaprime-offline-v1'
const OFFLINE_PAGE = '/offline.html'
const OFFLINE_LOGO = '/app-icons/icon-192.png'

self.addEventListener('install', event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.addAll([OFFLINE_PAGE, OFFLINE_LOGO])).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dentaprime-offline-') && key !== OFFLINE_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_PAGE)))
  } else if (url.pathname === OFFLINE_LOGO) {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_LOGO)))
  }
})
