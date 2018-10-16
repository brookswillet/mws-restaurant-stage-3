/* Bulk of code modified from samples available on 11 June 2018 from
 * https://developers.google.com/web/fundamentals/primers/service-workers/
 * and related pages. Modified to update variable names and content.
 */
var CACHE_NAME = 'rstrnt-static-v2.31';
//install service worker
// Perform install steps
  /*
  Open a cache.
  Cache our files.
  Confirm whether all the required assets are cached or not.
  */
var urlsToCache = [
    '/',
    '/restaurant.html',
    '/index.html',
    '/css/styles.css',
    '/data/restaurants.json',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/manifest.webmanifest'
  ];

//Direct copy from developer.google.com
self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

//Modified copy from developer.google.com <== removed normalizedUrl portion
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    // See /web/fundamentals/getting-started/primers/async-functions
    // for an async/await primer.
    event.respondWith(async function() {
      const normalizedUrl = new URL(event.request.url);
      normalizedUrl.search = '';
      // Create promises for both the network response,
      // and a copy of the response that can be used in the cache.
      const fetchResponseP = fetch(normalizedUrl);
      const fetchResponseCloneP = fetchResponseP.then(r => r.clone());

      // event.waitUntil() ensures that the service worker is kept alive
      // long enough to complete the cache update.
      event.waitUntil(async function() {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request.url, await fetchResponseCloneP);
      }());

      // Prefer the cached response, falling back to the fetch response.
      return (await caches.match(event.request.url)) || fetchResponseP;
    }());
  }
});

//Direct copy from developer.google.com (except feeding in VAR names)
self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
