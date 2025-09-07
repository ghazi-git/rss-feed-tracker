export function getSearchString(searchParams) {
  const search = new URLSearchParams(searchParams);
  return search.toString();
}
