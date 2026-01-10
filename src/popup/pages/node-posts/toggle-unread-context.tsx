import { batch, createContext, FlowProps, useContext } from "solid-js";

import { sendMessage } from "@/messaging-wrapper";
import { usePostsContext } from "@/popup/pages/node-posts/posts-context";
import { useUnreadCountContext } from "@/popup/pages/node-posts/unread-count-context";
import { notifyError } from "@/popup/utils/notifications";

const ToggleUnreadContext = createContext<ToggleUnreadContextType>();

export function ToggleUnreadContextProvider(props: FlowProps) {
  const { setPosts } = usePostsContext();
  const { mutateUnreadCount } = useUnreadCountContext();
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
      batch(() => {
        setPosts((oldPosts) => {
          return oldPosts.map((post) => {
            if (post.feedId === feedId && post.guid === guid) {
              return { ...post, unread: unread ? 1 : 0 };
            } else {
              return post;
            }
          });
        });
        mutateUnreadCount({ delta: unread ? 1 : -1 });
      });
    } else {
      notifyError(resp.errorMsg);
    }
  };

  return (
    <ToggleUnreadContext.Provider value={{ toggleUnread }}>
      {props.children}
    </ToggleUnreadContext.Provider>
  );
}

export function useToggleUnreadContext() {
  const context = useContext(ToggleUnreadContext);
  if (!context) {
    throw new Error("useToggleUnreadContext: cannot find ToggleUnreadContext");
  }

  return context;
}

interface ToggleUnreadContextType {
  toggleUnread: (
    feedId: number,
    guid: string,
    unread: boolean,
  ) => Promise<void>;
}
