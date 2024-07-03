// ========================================= Use service worker =========================================

const ANY_PAGE_ENDPOINT = "/pages";
const PRECACHED = ["/", ANY_PAGE_ENDPOINT];
const ALLOW_CACHE = [
  {
    regex: /^\/static+?/,
  },
  {
    regex: /^\/(?:(?:ru|ua|en)\/)?pages/,
    destination: ANY_PAGE_ENDPOINT,
  },
];
const CACHE_NAME = "cache_v1";

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

addEventListener("activate", async () => {
  await self.registration.navigationPreload.enable();
});

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  return await cache.addAll(PRECACHED);
}

function process_allow_cached({ event, url }) {
  const controller = ALLOW_CACHE.find(({ regex }) => regex.test(url.pathname));
  if (!controller) {
    return false;
  }
  event.respondWith(fetch_or_cache(controller.destination || event.request));
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

  process_allow_cached(context);
});
