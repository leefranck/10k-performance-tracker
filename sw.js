const BUILD = "20260919-0310-1";
const STATIC_CACHE = `tenk-static-${BUILD}`;
const RUNTIME_CACHE = `tenk-runtime-${BUILD}`;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  `./styles.css?v=${BUILD}`,
  `./ux-tweaks.css?v=${BUILD}`,
  `./week-flow.css?v=${BUILD}`,
  `./email-summary.css?v=${BUILD}`,
  `./app.js?v=${BUILD}`,
  `./strength-ux.js?v=${BUILD}`,
  `./day-ux.js?v=${BUILD}`,
  `./week-flow.js?v=${BUILD}`,
  `./email-summary.js?v=${BUILD}`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("tenk-") && ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Always try the network for the build manifest so update detection stays fresh.
  if (url.pathname.endsWith("/version.json")) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).catch(() => caches.match(request))
    );
    return;
  }

  // Navigation: network-first, cached app shell fallback when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
            (await caches.match("./index.html")) ||
            (await caches.match("./"));
        })
    );
    return;
  }

  // Static assets: cached first for instant/offline startup, refresh in background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
