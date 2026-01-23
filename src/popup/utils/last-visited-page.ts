import { useLocation } from "@solidjs/router";

export function saveLastVisitedPage(
  url: string,
  scrollPosition: number | null = null,
) {
  if (!url.endsWith(".html") && url !== "/") {
    const data = { url, scrollPosition, savedAt: new Date().toISOString() };
    window.localStorage.setItem("lastVisitedPage", JSON.stringify(data));
  }
}

/**
 * return the last visited URL only if was saved less than 15 mins ago. This is
 * helpful when users mistakenly click outside the popup causing it to close
 */
export function getLastVisitedPage(): LastVisitedPage | null {
  const data = window.localStorage.getItem("lastVisitedPage");
  if (!data) return null;

  try {
    const { url, scrollPosition, savedAt } = JSON.parse(data);
    const dt = new Date(savedAt);
    if (
      typeof url === "string" &&
      dt.getTime() > Date.now() - 15 * 60 * 1000 &&
      (typeof scrollPosition === "number" || scrollPosition === null)
    ) {
      return { url, scrollPosition };
    }
  } catch {}
  return null;
}

export function useCurrentURL() {
  const location = useLocation();
  return () => location.pathname + location.search + location.hash;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function restoreScrollPosition(initialState: any, currentURL: string) {
  try {
    const { scrollPosition, url } = initialState;
    if (
      typeof scrollPosition === "number" &&
      scrollPosition >= 0 &&
      currentURL === url
    ) {
      const pageBody = document.getElementById("page-body");
      if (pageBody) {
        pageBody.scrollTop = scrollPosition;
      }
    }
  } catch {}
}

interface LastVisitedPage {
  url: string;
  scrollPosition: number | null;
}
