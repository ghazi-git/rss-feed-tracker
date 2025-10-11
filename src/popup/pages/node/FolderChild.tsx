import { Show } from "solid-js";
import { dismissToast } from "solid-notifications";

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
import UnreadCount from "@/popup/pages/node/UnreadCount";
import { Node } from "@/popup/utils/dummy-data";
import { notifyInfo } from "@/popup/utils/notifications";

import styles from "./FolderChild.module.css";

export default function FolderChild(props: FolderChildProps) {
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
            onClick={(event) => {
              event.preventDefault();
              dismissToast();
              notifyInfo("Marked as read (not really though)");
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
              <FeedActions feedId={props.node.id} feedName={props.node.name} />
            }
          >
            <FolderActions
              folderId={props.node.id}
              folderName={props.node.name}
            />
          </Show>
        </Menu>
      </Dropdown>
    </Anchor>
  );
}

interface FolderChildProps {
  node: Node;
}
