import { useSearchParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";

import NoPosts from "@/popup/components/NoPosts.jsx";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PostsFilter from "@/popup/pages/node/PostsFilter.jsx";
import styles from "@/popup/pages/node-posts/index.module.css";
import Posts from "@/popup/pages/node-posts/Posts.jsx";
import { NODES, POSTS } from "@/popup/utils/dummy-data";

export default function Bookmarks() {
  const [searchParams] = useSearchParams();
  const bookmarks = () => {
    let posts = POSTS.filter((p) => p.bookmarked);
    posts = posts.map((post) => {
      const n = NODES.find((nd) => nd.id === post.feedId);
      return {
        ...post,
        feed: { name: n.name, favicon: n.feed.favicon },
      };
    });
    posts.sort((p1, p2) => p2.publishedAt - p1.publishedAt);
    return posts;
  };
  const filteredBookmarks = createMemo(() => {
    if (searchParams.unread === "true") {
      return bookmarks().filter((post) => post.unread);
    } else {
      return bookmarks();
    }
  });
  const unreadBookmarks = () => bookmarks().filter((post) => post.unread);

  return (
    <Show
      when={bookmarks().length > 0}
      fallback={<NoPosts msg="No posts bookmarked yet" />}
    >
      <PageHeaderWrapper>
        <PostsFilter
          pageUrl="/bookmarks"
          unreadCount={unreadBookmarks().length}
          initialFilter={searchParams.unread === "true" ? "unread" : "all"}
          class={styles["posts-filter"]}
        />
      </PageHeaderWrapper>
      <Posts posts={filteredBookmarks()} />
    </Show>
  );
}
