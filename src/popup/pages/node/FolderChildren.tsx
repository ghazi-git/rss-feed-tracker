import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/types";
import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/list-item";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { For, onCleanup, onMount } from "solid-js";

import { TreeNode } from "@/db-setup";
import FolderChild from "@/popup/pages/node/FolderChild";
import { useNodeContext } from "@/popup/pages/node/node-context";

import styles from "./FolderChildren.module.css";

export default function FolderChildren(props: FolderChildrenProps) {
  const { mutateNode } = useNodeContext();
  let elt!: HTMLDivElement;
  let cleanup: CleanupFn;
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
            mutateNode((resp) => {
              const children = moveNodeIntoFolder(
                resp.children,
                draggedNodeId,
                targetNodeId,
              );
              return { ...resp, children };
            });
            // todo send msg and revert on error using oldChildren
            console.log("oldChildren", oldChildren);
          } else if (
            instruction?.operation === "reorder-before" ||
            instruction?.operation === "reorder-after"
          ) {
            mutateNode((resp) => {
              const children = reorderNodes(
                props.childNodes,
                draggedNodeId,
                targetNodeId,
                instruction.operation,
              );
              return { ...resp, children };
            });
            // todo sendMsg + revert on error using oldChildren
          }
        }
      },
    });
  });
  onCleanup(() => cleanup?.());

  return (
    <div ref={elt} class={styles.children}>
      <For each={props.childNodes}>{(node) => <FolderChild node={node} />}</For>
    </div>
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
  operation: "reorder-before" | "reorder-after",
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

type ChildNode = TreeNode & { markAsReadUntil: number };
interface FolderChildrenProps {
  childNodes: ChildNode[];
}
