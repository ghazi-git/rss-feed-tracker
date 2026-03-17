import { useSearchParams } from "@solidjs/router";
import { batch } from "solid-js";

import PageHeaderWrapper from "@/popup/components/page-header/PageHeaderWrapper";
import PostsFilter from "@/popup/pages/node/PostsFilter";
import { usePostsContext } from "@/popup/pages/node-posts/posts-context";
import { useUnreadCountContext } from "@/popup/pages/node-posts/unread-count-context";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./BookmarksHeader.module.css";

export default function BookmarksHeader(props: BookmarksHeaderProps) {
  const [searchParams] = useSearchParams();
  const { setPosts } = usePostsContext();
  const { mutateUnreadCount } = useUnreadCountContext();
  const { mutation, sendMsg, reset } = createMutation(
    "posts/mark-all-bookmarks-as-read",
  );
  const markAsReadMutation = {
    async markAll() {
      await sendMsg(undefined);

      if (mutation.isSuccess) {
        batch(() => {
          setPosts((oldPosts) =>
            oldPosts.map((post) => ({ ...post, unread: 0 })),
          );
          mutateUnreadCount({ value: 0 });
          reset();
        });
      } else if (mutation.isError) {
        notifyError(mutation.errorMsg);
        reset();
      }
    },

    isLoading() {
      return mutation.isLoading;
    },
  };

  return (
    <PageHeaderWrapper sticky={true}>
      <PostsFilter
        pageUrl="/bookmarks"
        unreadCount={props.unreadCount}
        postsView={searchParams.unread === "true" ? "unread" : "all"}
        class={styles["posts-filter"]}
        markAsReadMutation={markAsReadMutation}
      />
    </PageHeaderWrapper>
  );
}

interface BookmarksHeaderProps {
  unreadCount: number;
}
