export function getSearchString(searchParams: Record<string, any>) {
  const search = new URLSearchParams(searchParams);
  return search.toString();
}
