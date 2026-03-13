import { FeedPost } from "@/messaging-wrapper";

export async function filterPosts(
  posts: FeedPost[],
  query: string,
  maxResults: number,
) {
  // check if the search term exists in the post's title and rank the posts by
  // where that term appears (the closer the term to the start, the higher the
  // post's rank)
  const term = query.trim().toLowerCase();
  const postsWithIndexes: [number, FeedPost][] = [];
  for (const post of posts) {
    const idx = post.title.toLowerCase().indexOf(term);
    if (idx >= 0) postsWithIndexes.push([idx, post]);

    if (postsWithIndexes.length >= maxResults) break;
  }
  postsWithIndexes.sort(([a], [b]) => a - b);

  return postsWithIndexes.map(([idx, post]) => ({
    ...post,
    termPositions: [{ start: idx, end: idx + term.length }],
  }));
}
