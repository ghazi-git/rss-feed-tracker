import { DeleteNodeProvider } from "@/popup/components/delete-node-dialog/context";
import DeleteNodeDialog from "@/popup/components/delete-node-dialog/DeleteNodeDialog";
import Separator from "@/popup/components/dropdown/Separator";
import DeleteFeedMenuItem from "@/popup/components/node-actions/DeleteFeedMenuItem";
import EditFeedMenuItem from "@/popup/components/node-actions/EditFeedMenuItem";
import ReloadNodeMenuItem from "@/popup/components/node-actions/ReloadNodeMenuItem";
import SearchMenuItem from "@/popup/components/node-actions/SearchMenuItem";

export default function NodeHeaderFeedActions(props: FeedActionsProps) {
  return (
    <>
      <EditFeedMenuItem feedId={props.feedId} />
      <ReloadNodeMenuItem nodeId={props.feedId} />
      <SearchMenuItem nodeId={props.feedId} nodeName={props.feedName} />
      <Separator />
      <DeleteNodeProvider>
        <DeleteFeedMenuItem
          feedId={props.feedId}
          feedName={props.feedName}
          parentFolderId={props.parentFolderId}
          deletionTrigger="nodeHeader"
        />
        <DeleteNodeDialog />
      </DeleteNodeProvider>
    </>
  );
}

interface FeedActionsProps {
  feedId: number;
  feedName: string;
  parentFolderId: number | null;
}
