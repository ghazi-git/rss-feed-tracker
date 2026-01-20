import { glogger } from "@/utils/logging";
import { ICONS_CACHE } from "@/utils/settings";

(self as unknown as ServiceWorkerGlobalScope).addEventListener(
  "fetch",
  (event) => {
    if (event.request.destination === "image") {
      event.respondWith(getFromCacheOrDefaultToNetwork(event.request));
    }
  },
);

async function getFromCacheOrDefaultToNetwork(request: FetchEvent["request"]) {
  const cache = await caches.open(ICONS_CACHE);
  const cachedResponse = await cache.match(request.url);
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (e) {
    glogger.error("fetch-image-handler", e);
    return new Response(null, { status: 404, statusText: "Not Found" });
  }
}
