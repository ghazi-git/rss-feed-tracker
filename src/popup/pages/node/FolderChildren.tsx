import { For, Show } from "solid-js";

import { TreeNode } from "@/background/db-setup";
import FolderChild from "@/popup/pages/node/FolderChild";
import FolderNoChildren from "@/popup/pages/node/FolderNoChildren";

import styles from "./FolderChildren.module.css";

export default function FolderChildren(props: FolderChildrenProps) {
  return (
    <Show
      when={props.childNodes.length > 0}
      fallback={<FolderNoChildren folderId={props.folderId} />}
    >
      <div class={styles.children}>
        <For each={props.childNodes}>
          {(node) => <FolderChild node={node} />}
        </For>
      </div>
    </Show>
  );
}

interface FolderChildrenProps {
  childNodes: TreeNode[];
  folderId: number;
}
