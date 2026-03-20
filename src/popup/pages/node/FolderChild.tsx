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
  createEffect,
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
import SingleLineText from "@/popup/components/SingleLineText";
import FolderIcon from "@/popup/components/svg-icons/FolderIcon";
import DropIndicator from "@/popup/pages/node/DropIndicator";
import FeedFavicon from "@/popup/pages/node/FeedFavicon";
import FolderChildFeedActions from "@/popup/pages/node/FolderChildFeedActions";
import FolderChildFolderActions from "@/popup/pages/node/FolderChildFolderActions";
import FolderChildMenuTrigger from "@/popup/pages/node/FolderChildMenuTrigger";
import { useListNavigationContext } from "@/popup/pages/node/list-navigation-context";
import { useNodeContext } from "@/popup/pages/node/node-context";
import UnreadCount from "@/popup/pages/node/UnreadCount";
import { useUnreadCountContext } from "@/popup/pages/node-posts/unread-count-context";
import { getListItemFromNode, isFocusedNode } from "@/popup/utils/keyboard-nav";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";
import { createShortcut } from "@/popup/utils/shortcuts";

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

  const { focusedItem, setFocusedItem } = useListNavigationContext();
  const tabindex = createMemo(() => {
    const item = focusedItem();
    // when no item is focused, make the first one focusable
    if (item === null && props.nodeIndex === 0) return 0;
    // this item is focused
    else if (isFocusedNode(item, props.node.id)) return 0;
    else return -1;
  });
  let anchor!: HTMLAnchorElement;
  createEffect(() => {
    if (isFocusedNode(focusedItem(), props.node.id)) {
      anchor.focus();
    }
  });
  const hasFocus = () => anchor.contains(document.activeElement);
  createShortcut("m", () => {
    if (
      props.node.unreadCount &&
      isFocusedNode(focusedItem(), props.node.id) &&
      hasFocus()
    ) {
      markAllAsRead();
    }
  });

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
        ref={anchor}
        class={styles.child}
        classList={{
          [styles["updates-off"]]: updatesOff(),
          [styles["drop-inside"]]: dropIndicator() === "combine",
          [styles.dragging]: dragging(),
        }}
        href={`/library/nodes/${props.node.id}`}
        role="listitem"
        tabindex={tabindex()}
        onFocus={() => {
          // update the focusedItem when tabbing into the element as opposed
          // to pressing arrowDown
          if (focusedItem() === null) {
            setFocusedItem(getListItemFromNode(props.node));
          }
        }}
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
            tabindex="-1"
          />
          <UnstyledButton
            class={styles["unread-link"]}
            onClick={(event) => {
              event.preventDefault();
              navigate(`/library/nodes/${props.node.id}/posts?unread=true`);
            }}
            tabindex="-1"
          >
            Unread
          </UnstyledButton>
        </Show>
        <Dropdown placement="bottom-end" fallbackPlacement="left">
          <FolderChildMenuTrigger
            htmlElementHasFocus={hasFocus}
            nodeId={props.node.id}
            label={
              props.node.type === "folder" ? "Folder Actions" : "Feed Actions"
            }
          />
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
