import { For } from "solid-js";

import { TreeNode } from "@/db-setup";
import FolderChild from "@/popup/pages/node/FolderChild";

import styles from "./FolderChildren.module.css";

export default function FolderChildren(props: FolderChildrenProps) {
  return (
    <div class={styles.children}>
      <For each={props.childNodes}>{(node) => <FolderChild node={node} />}</For>
    </div>
  );
}

interface FolderChildrenProps {
  childNodes: (TreeNode & { markAsReadUntil: number })[];
}
