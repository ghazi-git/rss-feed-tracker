import { For, Setter } from "solid-js";

import { FilterResult, sendMessage } from "@/messaging-wrapper";
import { PostMenuProvider } from "@/popup/components/context-menu/post-menu-context";
import { PostContextMenu } from "@/popup/components/context-menu/PostContextMenu";
import Post from "@/popup/pages/node-posts/Post";
import { ToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { ToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./FilterResults.module.css";

export default function FilterResults(props: FilterResultsProps) {
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
      props.mutateFilterResults((results) => {
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
      props.mutateFilterResults((results) => {
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
          <div
            class={`${styles["filter-results"]} ${props.isLoading ? styles.loading : ""}`}
          >
            <For each={props.posts}>
              {(post) => (
                <Post post={post}>
                  {highlightText(post.title, post.termPosition)}
                </Post>
              )}
            </For>
          </div>
        </ToggleUnreadContext.Provider>
      </ToggleBookmarkedContext.Provider>
    </PostMenuProvider>
  );
}

function highlightText(
  text: string,
  position: { start: number; end: number } | null,
) {
  if (!position) return text;

  const before = text.substring(0, position.start);
  const term = text.substring(position.start, position.end);
  const after = text.substring(position.end);
  return (
    <>
      {before}
      <mark>{term}</mark>
      {after}
    </>
  );
}

interface FilterResultsProps {
  posts: FilterResult[];
  isLoading: boolean;
  mutateFilterResults: Setter<FilterResult[] | undefined>;
}
