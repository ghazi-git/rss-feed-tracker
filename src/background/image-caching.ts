const CACHE_NAME = "image-cache-v1";

(self as unknown as ServiceWorkerGlobalScope).addEventListener(
  "fetch",
  (event) => {
    if (event.request.destination === "image") {
      event.respondWith(getFromCacheOrDefaultToNetwork(event.request));
    }
  },
);

async function getFromCacheOrDefaultToNetwork(request: FetchEvent["request"]) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request.url);
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (e) {
    console.error("fetch-image-handler", e);
    return new Response(null, { status: 404, statusText: "Not Found" });
  }
}
