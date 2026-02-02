import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { For, onCleanup, onMount } from "solid-js";

import { TreeNode } from "@/db-setup";
import { RelativePlacement, sendMessage } from "@/messaging-wrapper";
import FolderChild from "@/popup/pages/node/FolderChild";
import { MoveNodeContext } from "@/popup/pages/node/move-node-context";
import { useNodeContext } from "@/popup/pages/node/node-context";
import { notifyError } from "@/popup/utils/notifications";

import styles from "./FolderChildren.module.css";

export default function FolderChildren(props: FolderChildrenProps) {
  const { mutateNode } = useNodeContext();
  let elt!: HTMLDivElement;
  let cleanup: CleanupFn;
  // move the node locally, then save in db but revert if there was an error
  const saveNodePlacement = (
    newNodes: ChildNode[],
    oldNodes: ChildNode[],
    nodeId: number,
    targetId: number,
    placement: RelativePlacement,
  ) => {
    document.startViewTransition(() => {
      mutateNode((resp) => ({ ...resp, children: newNodes }));
    });

    const payload = { nodeId, targetId, placement };
    sendMessage("nodes/move-relative-to-target", payload).then((resp) => {
      if (!resp.success) {
        notifyError(resp.errorMsg);
        document.startViewTransition(() => {
          mutateNode((resp) => ({ ...resp, children: oldNodes }));
        });
      }
    });
  };
  onMount(() => {
    cleanup = monitorForElements({
      onDrop: ({ source, location }) => {
        // don't allow dropping an element on itself. Not using canDrop to avoid
        // showing the not-allowed cursor right after the element is picked up
        const draggedNodeId = source.data.nodeId as number;
        const dropTarget = location.current.dropTargets[0];
        if (
          draggedNodeId &&
          dropTarget &&
          dropTarget.data.nodeId &&
          draggedNodeId !== dropTarget.data.nodeId
        ) {
          const oldChildren = [...props.childNodes];
          const targetNodeId = dropTarget.data.nodeId as number;
          const instruction = extractInstruction(dropTarget.data);
          if (instruction?.operation === "combine") {
            document.startViewTransition(() => {
              mutateNode((resp) => {
                const children = moveNodeIntoFolder(
                  resp.children,
                  draggedNodeId,
                  targetNodeId,
                );
                return { ...resp, children };
              });
            });

            const payload = { nodeId: draggedNodeId, folderId: targetNodeId };
            sendMessage("nodes/move-into-sibling-folder", payload).then(
              (resp) => {
                if (!resp.success) {
                  notifyError(resp.errorMsg);
                  document.startViewTransition(() => {
                    mutateNode((resp) => ({ ...resp, children: oldChildren }));
                  });
                }
              },
            );
          } else if (
            instruction?.operation === "reorder-before" ||
            instruction?.operation === "reorder-after"
          ) {
            const updatedChildren = reorderNodes(
              props.childNodes,
              draggedNodeId,
              targetNodeId,
              instruction.operation,
            );
            saveNodePlacement(
              updatedChildren,
              oldChildren,
              draggedNodeId,
              targetNodeId,
              instruction.operation,
            );
          }
        }
      },
    });
  });
  onCleanup(() => cleanup?.());

  const modeNodeUpOrDown = (nodeId: number, direction: "up" | "down") => {
    const nodeIndex = findIndex(props.childNodes, nodeId);
    const siblingIndex = getSiblingIndex(
      props.childNodes.length,
      nodeIndex,
      direction,
    );
    if (siblingIndex !== null) {
      const oldChildren = [...props.childNodes];
      const sibling = props.childNodes[siblingIndex];
      const updatedChildren = reorderWithEdge({
        list: props.childNodes,
        axis: "vertical",
        startIndex: nodeIndex,
        indexOfTarget: siblingIndex,
        closestEdgeOfTarget: direction === "up" ? "top" : "bottom",
      });
      saveNodePlacement(
        updatedChildren,
        oldChildren,
        nodeId,
        sibling.id,
        direction === "up" ? "reorder-before" : "reorder-after",
      );
    }
  };

  return (
    <MoveNodeContext.Provider value={{ modeNodeUpOrDown }}>
      <div ref={elt} class={styles.children}>
        <For each={props.childNodes}>
          {(node, index) => (
            <FolderChild
              node={node}
              nodeIndex={index()}
              childrenCount={props.childNodes.length}
            />
          )}
        </For>
      </div>
    </MoveNodeContext.Provider>
  );
}

function moveNodeIntoFolder(
  children: ChildNode[],
  nodeId: number,
  folderId: number,
) {
  const idx = findIndex(children, nodeId);
  if (idx >= 0) {
    // remove the draggedNode from the list and update the unreadCount
    // for its new parent folder
    const draggedNode = children[idx];
    const updatedChildren: ChildNode[] = [];
    children.forEach((child) => {
      if (child.id === folderId) {
        const count = child.unreadCount + draggedNode.unreadCount;
        updatedChildren.push({ ...child, unreadCount: count });
      } else if (child.id !== nodeId) {
        updatedChildren.push(child);
      }
    });
    return updatedChildren;
  }
  return children;
}

function reorderNodes(
  nodes: ChildNode[],
  draggedNodeId: number,
  targetNodeId: number,
  operation: RelativePlacement,
) {
  const currentIndex = findIndex(nodes, draggedNodeId);
  const targetIndex = findIndex(nodes, targetNodeId);
  if (currentIndex >= 0 && targetIndex >= 0) {
    return reorderWithEdge({
      list: nodes,
      axis: "vertical",
      startIndex: currentIndex,
      indexOfTarget: targetIndex,
      closestEdgeOfTarget: operation === "reorder-before" ? "top" : "bottom",
    });
  }
  return nodes;
}

function findIndex(array: ChildNode[], id: number) {
  return array.findIndex((n) => n.id === id);
}

function getSiblingIndex(
  nodesCount: number,
  nodeIndex: number,
  dir: "up" | "down",
) {
  if (nodeIndex > 0 && dir === "up") {
    return nodeIndex - 1;
  } else if (nodeIndex >= 0 && nodeIndex < nodesCount - 1 && dir === "down") {
    return nodeIndex + 1;
  }
  return null;
}

type ChildNode = TreeNode & { markAsReadUntil: number };
interface FolderChildrenProps {
  childNodes: ChildNode[];
}
