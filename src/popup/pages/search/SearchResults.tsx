import { For, Setter, Show } from "solid-js";

import { SearchResult, sendMessage } from "@/messaging-wrapper";
import { PostMenuProvider } from "@/popup/components/context-menu/post-menu-context";
import { PostContextMenu } from "@/popup/components/context-menu/PostContextMenu";
import Post from "@/popup/pages/node-posts/Post";
import { ToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { ToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./SearchResults.module.css";

export default function SearchResults(props: SearchResultsProps) {
  const toggleUnread = async (
    feedId: number,
    guid: string,
    unread: boolean,
  ) => {
    const resp = await sendMessage("posts/toggle-unread", {
      feedId,
      guid,
      unread,
    });
    if (resp.success) {
      props.mutateSearchResults((results) => {
        if (!results) return results;

        return results.map((post) => {
          if (post.feedId === feedId && post.guid === guid) {
            return { ...post, unread: unread ? 1 : 0 };
          } else {
            return post;
          }
        });
      });
    } else {
      notifyError(resp.errorMsg);
    }
  };
  const toggleBookmarked = async (
    feedId: number,
    guid: string,
    bookmarked: boolean,
  ) => {
    const resp = await sendMessage("posts/toggle-bookmarked", {
      feedId,
      guid,
      bookmarked,
    });
    if (resp.success) {
      props.mutateSearchResults((results) => {
        if (!results) return results;

        return results.map((post) => {
          if (post.feedId === feedId && post.guid === guid) {
            return { ...post, bookmarked: bookmarked ? 1 : 0 };
          } else {
            return post;
          }
        });
      });
    } else {
      notifyError(resp.errorMsg);
    }
  };

  return (
    <Show
      when={props.posts.length}
      fallback={
        <div class={styles["no-results"]}>
          No posts found matching the search criteria.
        </div>
      }
    >
      <h1 class={styles["search-results-title"]}>
        Found {props.posts.length} post{props.posts.length === 1 ? "" : "s"}:
      </h1>
      <PostMenuProvider>
        <PostContextMenu />
        <ToggleBookmarkedContext.Provider value={{ toggleBookmarked }}>
          <ToggleUnreadContext.Provider value={{ toggleUnread }}>
            <div class={styles["search-results"]}>
              <For each={props.posts}>{(post) => <Post post={post} />}</For>
            </div>
          </ToggleUnreadContext.Provider>
        </ToggleBookmarkedContext.Provider>
      </PostMenuProvider>
    </Show>
  );
}

interface SearchResultsProps {
  posts: SearchResult[];
  mutateSearchResults: Setter<SearchResult[] | undefined>;
}
