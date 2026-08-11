// ORN Ops Mobile — service worker
// Caches the app shell so the login/search UI opens even on a poor connection.
// Booking DATA is always fetched live from Firebase (never cached), so it's current.
const CACHE = 'orn-ops-mobile-v2';
const SHELL = ['./', './index.html', './users.js', './manifest.json', './icon-192.png', './icon-512.png', './icon-180.png', './icon-64.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  const url = e.request.url;
  // Never cache Firebase / Google API calls — always go to network for live data
  if(url.includes('firestore') || url.includes('googleapis') || url.includes('gstatic')){
    return; // default network handling
  }
  // App shell: cache-first, fall back to network
  e.respondWith(
    caches.match(e.request).then(hit=> hit || fetch(e.request).then(resp=>{
      if(e.request.method==='GET' && resp && resp.status===200 && e.request.url.startsWith(self.location.origin)){
        const clone=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request, clone));
      }
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
