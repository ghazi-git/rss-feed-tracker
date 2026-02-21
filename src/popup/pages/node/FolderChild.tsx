import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import {
  attachInstruction,
  extractInstruction,
  Operation,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import { useNavigate } from "@solidjs/router";
import {
  batch,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { TreeNode } from "@/db-setup";
import { RelativePlacement } from "@/messaging-wrapper";
import Anchor from "@/popup/components/Anchor";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import Dropdown from "@/popup/components/dropdown/Dropdown";
import Menu from "@/popup/components/dropdown/Menu";
import MenuTrigger from "@/popup/components/dropdown/MenuTrigger";
import SingleLineText from "@/popup/components/SingleLineText";
import FolderIcon from "@/popup/components/svg-icons/FolderIcon";
import ThreeDotIcon from "@/popup/components/svg-icons/ThreeDotIcon";
import DropIndicator from "@/popup/pages/node/DropIndicator";
import FeedFavicon from "@/popup/pages/node/FeedFavicon";
import FolderChildFeedActions from "@/popup/pages/node/FolderChildFeedActions";
import FolderChildFolderActions from "@/popup/pages/node/FolderChildFolderActions";
import { useNodeContext } from "@/popup/pages/node/node-context";
import UnreadCount from "@/popup/pages/node/UnreadCount";
import { useUnreadCountContext } from "@/popup/pages/node-posts/unread-count-context";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./FolderChild.module.css";

export default function FolderChild(props: FolderChildProps) {
  const navigate = useNavigate();
  const { mutation, sendMsg } = createMutation("posts/mark-all-posts-as-read");
  const { mutateUnreadCount } = useUnreadCountContext();
  const { mutateNode } = useNodeContext();
  const markAllAsRead = async () => {
    await sendMsg({
      nodeId: props.node.id,
      markAsReadUntil: props.node.markAsReadUntil,
    });
    if (mutation.isSuccess) {
      batch(() => {
        mutateUnreadCount({ delta: -props.node.unreadCount });
        // eslint-disable-next-line solid/reactivity
        mutateNode((resp) => {
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
  const updatesOff = () => {
    return props.node.type === "feed" && !props.node.feed.updateFrequency;
  };
  const [dragging, setDragging] = createSignal(false);
  const [dropIndicator, setDropIndicator] = createSignal<Operation | null>(
    null,
  );
  const beforeOrAfter = createMemo(() => {
    const indicator = dropIndicator();
    if (indicator === "reorder-before" || indicator === "reorder-after") {
      return indicator as RelativePlacement;
    }
    return null;
  });
  let wrapper!: HTMLDivElement;
  let cleanup: CleanupFn;
  onMount(() => {
    cleanup = combine(
      draggable({
        element: wrapper,
        getInitialData: () => ({ nodeId: props.node.id }),
        onDragStart: () => setDragging(true),
        onDrop: () => setDragging(false),
      }),
      dropTargetForElements({
        element: wrapper,
        getData: ({ input, element }) => {
          const data = { nodeId: props.node.id };
          return attachInstruction(data, {
            input,
            element,
            operations:
              props.node.type === "folder"
                ? {
                    "reorder-before": "available",
                    "reorder-after": "available",
                    combine: "available",
                  }
                : {
                    "reorder-before": "available",
                    "reorder-after": "available",
                    combine: "not-available",
                  },
          });
        },
        onDrag: ({ source, self }) => {
          const draggedNodeId = source.data.nodeId;
          if (!!draggedNodeId && draggedNodeId !== props.node.id) {
            const instruction = extractInstruction(self.data);
            setDropIndicator(instruction?.operation ?? null);
          }
        },
        onDragEnter: ({ source, self }) => {
          const draggedNodeId = source.data.nodeId;
          if (!!draggedNodeId && draggedNodeId !== props.node.id) {
            const instruction = extractInstruction(self.data);
            setDropIndicator(instruction?.operation ?? null);
          }
        },
        onDragLeave: () => setDropIndicator(null),
        onDrop: () => setDropIndicator(null),
      }),
    );
  });
  onCleanup(() => cleanup?.());

  return (
    <div
      ref={wrapper}
      class={styles.dropzone}
      style={{ "view-transition-name": `node-${props.node.id}` }}
    >
      <Show when={beforeOrAfter()}>
        {(placement) => <DropIndicator placement={placement()} />}
      </Show>
      <Anchor
        class={styles.child}
        classList={{
          [styles["updates-off"]]: updatesOff(),
          [styles["drop-inside"]]: dropIndicator() === "combine",
          [styles.dragging]: dragging(),
        }}
        href={`/library/nodes/${props.node.id}`}
      >
        <div class={styles.icon}>
          <Show when={props.node.type === "feed"} fallback={<FolderIcon />}>
            <FeedFavicon
              favicon={props.node.feed!.favicon}
              name={props.node.name}
            />
          </Show>
        </div>
        <SingleLineText text={props.node.name} />
        <Show when={props.node.unreadCount}>
          <UnreadCount
            count={props.node.unreadCount}
            isLoading={mutation.isLoading}
            onClick={(event) => {
              event.preventDefault();
              markAllAsRead();
            }}
          />
          <UnstyledButton
            class={styles["unread-link"]}
            onClick={(event) => {
              event.preventDefault();
              navigate(`/library/nodes/${props.node.id}/posts?unread=true`);
            }}
          >
            Unread
          </UnstyledButton>
        </Show>
        <Dropdown placement="bottom-end" fallbackPlacement="left">
          <MenuTrigger
            onClick={(event) => event.preventDefault()}
            aria-label={
              props.node.type === "folder" ? "Folder Actions" : "Feed Actions"
            }
          >
            <ThreeDotIcon class={styles["post-actions-icon"]} />
          </MenuTrigger>
          <Menu>
            <Show
              when={props.node.type === "folder"}
              fallback={
                <FolderChildFeedActions
                  feedId={props.node.id}
                  feedName={props.node.name}
                  nodeIndex={props.nodeIndex}
                  childrenCount={props.childrenCount}
                />
              }
            >
              <FolderChildFolderActions
                folderId={props.node.id}
                folderName={props.node.name}
                nodeIndex={props.nodeIndex}
                childrenCount={props.childrenCount}
              />
            </Show>
          </Menu>
        </Dropdown>
      </Anchor>
    </div>
  );
}

interface FolderChildProps {
  node: TreeNode & { markAsReadUntil: number };
  nodeIndex: number;
  childrenCount: number;
}
