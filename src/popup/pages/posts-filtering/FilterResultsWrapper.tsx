import { FlowProps, Setter } from "solid-js";

import { FeedPost, sendMessage } from "@/messaging-wrapper";
import { PostMenuProvider } from "@/popup/components/context-menu/post-menu-context";
import { PostContextMenu } from "@/popup/components/context-menu/PostContextMenu";
import { ToggleBookmarkedContext } from "@/popup/pages/node-posts/toggle-bookmarked-context";
import { ToggleUnreadContext } from "@/popup/pages/node-posts/toggle-unread-context";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./FilterResultsWrapper.module.css";

export default function FilterResultsWrapper(props: FilterResultsWrapperProps) {
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
      props.mutateResults((results) => {
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
      props.mutateResults((results) => {
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
            {props.children}
          </div>
        </ToggleUnreadContext.Provider>
      </ToggleBookmarkedContext.Provider>
    </PostMenuProvider>
  );
}

interface FilterResultsWrapperProps extends FlowProps {
  isLoading: boolean;
  mutateResults: Setter<FeedPost[] | undefined>;
}
