export function getSearchString(searchParams: Record<string, string>) {
  const search = new URLSearchParams(searchParams);
  return search.toString();
}

export function openTab(url: string, active = false) {
  chrome.tabs.create({ url, active });
}

export function openWindow(url: string, incognito = false) {
  chrome.windows.create({ url, incognito });
}
