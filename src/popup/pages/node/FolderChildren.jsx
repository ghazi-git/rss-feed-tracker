import { For, Show } from "solid-js";

import FolderChild from "@/popup/pages/node/FolderChild.jsx";
import FolderNoChildren from "@/popup/pages/node/FolderNoChildren.jsx";
import { NODES } from "@/popup/utils/dummy-data";

import styles from "./FolderChildren.module.css";

export default function FolderChildren(props) {
  const children = () => {
    const nodes = NODES.filter((node) => node.parentId === props.folderId);
    nodes.sort((n1, n2) => n1.sortOrder - n2.sortOrder);
    return nodes;
  };

  return (
    <Show
      when={children().length > 0}
      fallback={<FolderNoChildren folderId={props.folderId} />}
    >
      <div class={styles.children}>
        <For each={children()}>{(node) => <FolderChild node={node} />}</For>
      </div>
    </Show>
  );
}
