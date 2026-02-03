import Separator from "@/popup/components/dropdown/Separator";
import DeleteFolderMenuItem from "@/popup/components/node-actions/DeleteFolderMenuItem";
import EditFolderMenuItem from "@/popup/components/node-actions/EditFolderMenuItem";
import MoveNodeDownMenuItem from "@/popup/components/node-actions/MoveNodeDownMenuItem";
import MoveNodeUpMenuItem from "@/popup/components/node-actions/MoveNodeUpMenuItem";
import ReloadNodeMenuItem from "@/popup/components/node-actions/ReloadNodeMenuItem";

export default function FolderChildFolderActions(props: FolderActionsProps) {
  return (
    <>
      <EditFolderMenuItem folderId={props.folderId} />
      <ReloadNodeMenuItem nodeId={props.folderId} />
      <Separator />
      <MoveNodeUpMenuItem
        nodeId={props.folderId}
        disabled={props.childrenCount === 1 || props.nodeIndex === 0}
      />
      <MoveNodeDownMenuItem
        nodeId={props.folderId}
        disabled={
          props.childrenCount === 1 ||
          props.nodeIndex === props.childrenCount - 1
        }
      />
      <Separator />
      <DeleteFolderMenuItem
        folderId={props.folderId}
        folderName={props.folderName}
        deletionTrigger="folderChild"
      />
    </>
  );
}

interface FolderActionsProps {
  folderId: number;
  folderName: string;
  nodeIndex: number;
  childrenCount: number;
}
