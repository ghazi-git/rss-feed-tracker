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
      <SearchMenuItem nodeId={props.feedId} />
      <Separator />
      <DeleteFeedMenuItem
        feedId={props.feedId}
        feedName={props.feedName}
        deletionTrigger="nodeHeader"
      />
    </>
  );
}

interface FeedActionsProps {
  feedId: number;
  feedName: string;
}
