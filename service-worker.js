
const CACHE_NAME = "study-track-pwa-v3";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    await Promise.all(APP_FILES.map(async (file) => {
      try {
        const response = await fetch(file, { cache: "reload" });
        if (response.ok) {
          await cache.put(file, response.clone());
        }
      } catch (_) {}
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(
          (key) =>
            key.startsWith("study-track-pwa-") &&
            key !== CACHE_NAME
        )
        .map((key) => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request, {
          cache: "no-store"
        });

        if (response.ok) {
          await cache.put("./index.html", response.clone());
        }

        return response;
      } catch (_) {
        return (
          await caches.match(request) ||
          await caches.match("./index.html") ||
          await caches.match("./")
        );
      }
    })());

    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);

    const networkRequest = fetch(request).then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    });

    return cached || networkRequest.catch(
      () => caches.match(request)
    );
  })());
});
