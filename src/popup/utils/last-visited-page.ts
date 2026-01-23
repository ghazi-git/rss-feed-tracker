/**
 * A set of helpers for saving and loading the state of the last visited page.
 * By tracking the last visited page, we can take users to where they left off
 * if they mistakenly close the extension popup.
 * The last visited page will be restored only if it has been less than 15 mins
 * since the extension was closed.
 * The scroll position helps scroll the page to the exact place the user was in.
 * Posts and bookmarks pages are paginated lists, so we also track postsCount
 * to load the exact number of posts the user has previously loaded
 */
import { useLocation } from "@solidjs/router";

export function saveLastVisitedPage(
  url: string,
  scrollPosition: number | null = null,
  postsCount: number | null = null,
) {
  if (!url.endsWith(".html") && url !== "/") {
    const data = {
      url,
      scrollPosition,
      postsCount,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("lastVisitedPage", JSON.stringify(data));
  }
}

export function getLastVisitedPage(): LastVisitedPage | null {
  const data = window.localStorage.getItem("lastVisitedPage");
  if (!data) return null;

  try {
    const { url, scrollPosition, postsCount, savedAt } = JSON.parse(data);
    const dt = new Date(savedAt);
    if (
      typeof url === "string" &&
      dt.getTime() > Date.now() - 15 * 60 * 1000 &&
      (typeof postsCount === "number" || postsCount === null) &&
      (typeof scrollPosition === "number" || scrollPosition === null)
    ) {
      return { url, scrollPosition, postsCount };
    }
  } catch {}
  return null;
}

export function useCurrentURL() {
  const location = useLocation();
  return () => location.pathname + location.search + location.hash;
}

export function useInitialState(): {
  url: string;
  scrollPosition: number;
  postsCount: number | null;
} | null {
  const location = useLocation();
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { scrollPosition, postsCount, url } = location.state as any;
    if (
      typeof url === "string" &&
      (typeof postsCount === "number" || postsCount === null) &&
      typeof scrollPosition === "number" &&
      scrollPosition >= 0
    ) {
      return { scrollPosition, url, postsCount };
    }
  } catch {}
  return null;
}

interface LastVisitedPage {
  url: string;
  scrollPosition: number | null;
  postsCount: number | null;
}
