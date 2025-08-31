import { useLocation } from "@solidjs/router";

export function isPostsPage() {
  const location = useLocation();
  const regex = /^\/home\/nodes\/\d+\/posts/;
  return regex.test(location.pathname);
}
