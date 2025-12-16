import { Navigate, useParams } from "@solidjs/router";
import { Show } from "solid-js";

import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import FolderChildren from "@/popup/pages/node/FolderChildren";
import FolderPageHeader from "@/popup/pages/node/FolderPageHeader";
import { NODES } from "@/popup/utils/dummy-data";

export default function Node() {
  const params = useParams();
  const node = () => NODES.find((n) => n.id === parseInt(params.id));
  const hasChildren = () => NODES.some((n) => n.parentId === node()?.id);
  const folderNode = () => {
    const nd = node();
    return nd?.type === "folder" ? nd : null;
  };

  return (
    <Show when={node()} fallback={<h2>Folder or Feed not Found</h2>}>
      {(currentNode) => (
        <Show
          when={folderNode()}
          fallback={
            <Navigate href={`/library/nodes/${currentNode().id}/posts`} />
          }
        >
          {(folder) => (
            <DeleteNodeProvider>
              <FolderPageHeader folder={folder()} hasChildren={hasChildren()} />
              <FolderChildren folderId={folder().id} />
              <DeleteNodeDialog deletionTriggeredFrom="parentFolderPage" />
            </DeleteNodeProvider>
          )}
        </Show>
      )}
    </Show>
  );
}
