export function saveLastVisitedPage(url: string) {
  const data = { url, savedAt: new Date().toISOString() };
  window.localStorage.setItem("lastVisitedURL", JSON.stringify(data));
}

/**
 * return the last visited URL only if was saved less than 15 mins ago. This is
 * helpful when users mistakenly click outside the popup causing it to close
 */
export function getLastVisitedPage(): string | null {
  const data = window.localStorage.getItem("lastVisitedURL");
  if (!data) return null;

  try {
    const { url, savedAt } = JSON.parse(data);
    const dt = new Date(savedAt);
    if (typeof url === "string" && dt.getTime() > Date.now() - 15 * 60 * 1000) {
      return url;
    }
  } catch {}
  return null;
}
