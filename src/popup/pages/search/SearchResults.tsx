import { For, Setter } from "solid-js";

import { SearchResult, sendMessage } from "@/messaging-wrapper";
import { PostMenuProvider } from "@/popup/components/context-menu/post-menu-context";
import { PostContextMenu } from "@/popup/components/context-menu/PostContextMenu";
import Post from "@/popup/pages/node-posts/Post";
import { ToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { ToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import { notifyError } from "@/popup/utils/notifications";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { SortBy } from "@/popup/utils/search";

import styles from "./SearchResults.module.css";

export default function SearchResults(props: SearchResultsProps) {
  const { preferences } = usePreferencesContext();
  const sortedPosts = () => {
    const sortField = preferences.orderPostsBy;
    if (props.sortBy === "time_desc") {
      return props.posts.toSorted((a, b) => b[sortField] - a[sortField]);
    } else if (props.sortBy === "time_asc") {
      return props.posts.toSorted((a, b) => a[sortField] - b[sortField]);
    } else {
      return props.posts.toSorted(
        (a, b) => b.relevanceScore - a.relevanceScore,
      );
    }
  };
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
    <PostMenuProvider>
      <PostContextMenu />
      <ToggleBookmarkedContext.Provider value={{ toggleBookmarked }}>
        <ToggleUnreadContext.Provider value={{ toggleUnread }}>
          <div class={styles["search-results"]}>
            <For each={sortedPosts()}>{(post) => <Post post={post} />}</For>
          </div>
        </ToggleUnreadContext.Provider>
      </ToggleBookmarkedContext.Provider>
    </PostMenuProvider>
  );
}

interface SearchResultsProps {
  posts: SearchResult[];
  mutateSearchResults: Setter<SearchResult[] | undefined>;
  sortBy: SortBy;
}
