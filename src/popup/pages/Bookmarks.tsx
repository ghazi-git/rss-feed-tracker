import { useSearchParams } from "@solidjs/router";
import { createMemo, createSignal, onMount, Show } from "solid-js";

import { Post, TreeNode } from "@/background/db-setup";
import { sendMessage } from "@/messaging-wrapper";
import NoPosts from "@/popup/components/NoPosts";
import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import styles from "@/popup/pages/node-posts/index.module.css";
import Posts from "@/popup/pages/node-posts/Posts";
import { notifyError } from "@/popup/utils/notifications";

export default function Bookmarks() {
  const [unreadCount, setUnreadCount] = createSignal(0);
  onMount(async () => {
    const resp = await sendMessage(
      "posts/get-unread-bookmarks-count",
      undefined,
    );
    if (resp.success) {
      setUnreadCount(resp.data);
    } else {
      notifyError(resp.errorMsg);
    }
  });

  const [searchParams] = useSearchParams();
  const bookmarks = () => {
    const bookmarkedPosts = ([] as Post[]).filter((p) => p.bookmarked);
    const posts = bookmarkedPosts.map((post) => {
      const n = ([] as TreeNode[]).find((nd) => nd.id === post.feedId);
      return {
        ...post,
        feed: { name: n!.name, favicon: n!.feed!.favicon },
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

  return (
    <Show
      when={bookmarks().length > 0}
      fallback={<NoPosts msg="No posts bookmarked yet" />}
    >
      <PageHeaderWrapper>
        <PostsFilter
          pageUrl="/bookmarks"
          unreadCount={unreadCount()}
          initialFilter={searchParams.unread === "true" ? "unread" : "all"}
          class={styles["posts-filter"]}
        />
      </PageHeaderWrapper>
      <Posts posts={filteredBookmarks()} />
    </Show>
  );
}
