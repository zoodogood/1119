// ========================================= Use service worker =========================================

const ANY_PAGE_ENDPOINT = "/pages";
const PRECACHED = ["/", ANY_PAGE_ENDPOINT];
const CACHE_NAME = "cache_v1";

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  return await cache.addAll(PRECACHED);
}

function process_pages_path({ event, url }) {
  // Regex must equal to src/server/api/pages.js some regexp
  if (!url.pathname.match(/^\/(?:(?:ru|ua|en)\/)?pages/)) {
    return false;
  }

  event.respondWith(fetch_or_cache(ANY_PAGE_ENDPOINT));
  return true;
}

function process_static_path({ request, event }) {
  event.respondWith(fetch_or_cache(request));
  return true;
}

async function fetch_or_cache(request) {
  self.skipWaiting();
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const { hostname } = url;
  if (hostname !== self.location.hostname) {
    return;
  }
  if (request.method !== "GET") {
    return;
  }
  const context = {
    event,
    url,
    self,
    request,
  };

  if (process_pages_path(context)) {
    return;
  }

  if (process_static_path(context)) {
    return;
  }
  event.respondWith(fetch(event.request.url));
});
