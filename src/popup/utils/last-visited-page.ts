export function saveLastVisitedPage(url: string) {
  window.localStorage.setItem("lastVisitedURL", url);
}

export function getLastVisitedPage(): string | null {
  return window.localStorage.getItem("lastVisitedURL");
}
