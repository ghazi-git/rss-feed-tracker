export function getSearchString(searchParams: Record<string, string>) {
  const search = new URLSearchParams(searchParams);
  return search.toString();
}
