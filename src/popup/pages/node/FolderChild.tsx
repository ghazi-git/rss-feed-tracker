import { batch, Show } from "solid-js";

import { TreeNode } from "@/background/db-setup";
import Anchor from "@/popup/components/Anchor";
import Dropdown from "@/popup/components/dropdown/Dropdown";
import Menu from "@/popup/components/dropdown/Menu";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger";
import FeedActions from "@/popup/components/FeedActions";
import FolderActions from "@/popup/components/FolderActions";
import SingleLineText from "@/popup/components/SingleLineText";
import FolderIcon from "@/popup/components/svg-icons/FolderIcon";
import ThreeDotIcon from "@/popup/components/svg-icons/ThreeDotIcon";
import FeedFavicon from "@/popup/pages/node/FeedFavicon";
import { useNodeContext } from "@/popup/pages/node/node-context";
import UnreadCount from "@/popup/pages/node/UnreadCount";
import { usePostsFilterUnreadCountContext } from "@/popup/pages/posts-filter-unread-count-context";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./FolderChild.module.css";

export default function FolderChild(props: FolderChildProps) {
  const { mutation, sendMsg } = createMutation("posts/mark-all-posts-as-read");
  const { updateUnreadCount } = usePostsFilterUnreadCountContext();
  const { mutateNode } = useNodeContext();
  const markAllAsRead = async () => {
    await sendMsg({
      nodeId: props.node.id,
      markAsReadUntil: props.node.markAsReadUntil,
    });
    if (mutation.isSuccess) {
      batch(() => {
        updateUnreadCount({ delta: -props.node.unreadCount });
        mutateNode((resp) => {
          if (!resp) return resp;

          const children = resp.children.map((c) => {
            return c.id === props.node.id ? { ...c, unreadCount: 0 } : c;
          });
          return { ...resp, children };
        });
      });
    } else if (mutation.isError) {
      notifyError(mutation.errorMsg);
    }
  };

  return (
    <Anchor class={styles.child} href={`/library/nodes/${props.node.id}`}>
      <div class={styles.icon}>
        <Show when={props.node.type === "feed"} fallback={<FolderIcon />}>
          <FeedFavicon
            favicon={props.node.feed!.favicon}
            name={props.node.name}
          />
        </Show>
        <Show when={props.node.unreadCount}>
          <UnreadCount
            count={props.node.unreadCount}
            isLoading={mutation.isLoading}
            onClick={(event) => {
              event.preventDefault();
              markAllAsRead();
            }}
          />
        </Show>
      </div>
      <SingleLineText text={props.node.name} />
      <Dropdown placement="bottom-end" fallbackPlacement="left">
        <MenuTrigger onClick={(event) => event.preventDefault()}>
          <ThreeDotIcon class={styles["post-actions-icon"]} />
        </MenuTrigger>
        <Menu>
          <Show
            when={props.node.type === "folder"}
            fallback={
              <FeedActions
                feedId={props.node.id}
                feedName={props.node.name}
                deletionTrigger="folderChild"
              />
            }
          >
            <FolderActions
              folderId={props.node.id}
              folderName={props.node.name}
              deletionTrigger="folderChild"
            />
          </Show>
        </Menu>
      </Dropdown>
    </Anchor>
  );
}

interface FolderChildProps {
  node: TreeNode & { markAsReadUntil: number };
}
