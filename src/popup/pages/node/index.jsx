import { Navigate, useParams } from "@solidjs/router";
import { Show } from "solid-js";

import FolderChildren from "@/popup/pages/node/FolderChildren.jsx";
import NodeHeader from "@/popup/pages/node/NodeHeader.jsx";
import { NODES } from "@/popup/utils/dummy-data.js";

export default function Node() {
  const params = useParams();
  const node = () => NODES.find((n) => n.id === parseInt(params.id));
  const hasChildren = () => NODES.some((n) => n.parentId === node().id);

  return (
    <Show when={node()} fallback={<h2>Folder or Feed not Found</h2>}>
      <Show
        when={node().type === "folder"}
        fallback={<Navigate href={`/home/nodes/${node().id}/posts`} />}
      >
        <NodeHeader node={node()} showFilter={hasChildren()} />
        <FolderChildren folderId={node().id} />
      </Show>
    </Show>
  );
}
