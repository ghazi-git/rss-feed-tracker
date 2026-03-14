import { Show } from "solid-js";

import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import Separator from "@/popup/components/dropdown/Separator";
import AddFeedMenuItem from "@/popup/components/node-actions/AddFeedMenuItem";
import AddFolderMenuItem from "@/popup/components/node-actions/AddFolderMenuItem";
import DeleteFolderMenuItem from "@/popup/components/node-actions/DeleteFolderMenuItem";
import EditFolderMenuItem from "@/popup/components/node-actions/EditFolderMenuItem";
import ExportFeedsMenuItem from "@/popup/components/node-actions/ExportFeedsMenuItem";
import ImportFeedsMenuItem from "@/popup/components/node-actions/ImportFeedsMenuItem";
import ReloadNodeMenuItem from "@/popup/components/node-actions/ReloadNodeMenuItem";
import SearchMenuItem from "@/popup/components/node-actions/SearchMenuItem";

export default function NodeHeaderFolderActions(props: FolderActionsProps) {
  return (
    <>
      <EditFolderMenuItem folderId={props.folderId} />
      <ReloadNodeMenuItem nodeId={props.folderId} />
      <SearchMenuItem nodeId={props.folderId} nodeName={props.folderName} />
      <Separator />
      <AddFeedMenuItem folderId={props.folderId} />
      <AddFolderMenuItem folderId={props.folderId} />
      <Separator />
      <ImportFeedsMenuItem folderId={props.folderId} />
      <ExportFeedsMenuItem folderId={props.folderId} />
      <Show when={!props.isRoot}>
        <Separator />
        <DeleteNodeProvider>
          <DeleteFolderMenuItem
            folderId={props.folderId}
            folderName={props.folderName}
            deletionTrigger="nodeHeader"
            parentFolderId={props.parentFolderId}
          />
          <DeleteNodeDialog />
        </DeleteNodeProvider>
      </Show>
    </>
  );
}

interface FolderActionsProps {
  isRoot: boolean;
  folderId: number;
  folderName: string;
  parentFolderId: number | null;
}
