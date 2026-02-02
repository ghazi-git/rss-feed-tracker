import { Show } from "solid-js";

import Separator from "@/popup/components/dropdown/Separator";
import DeleteFeedMenuItem from "@/popup/components/node-actions/DeleteFeedMenuItem";
import EditFeedMenuItem from "@/popup/components/node-actions/EditFeedMenuItem";
import MoveNodeDownMenuItem from "@/popup/components/node-actions/MoveNodeDownMenuItem";
import MoveNodeUpMenuItem from "@/popup/components/node-actions/MoveNodeUpMenuItem";
import ReloadNodeMenuItem from "@/popup/components/node-actions/ReloadNodeMenuItem";

export default function FolderChildFeedActions(props: FeedActionsProps) {
  return (
    <>
      <EditFeedMenuItem feedId={props.feedId} />
      <ReloadNodeMenuItem nodeId={props.feedId} />
      <Separator />
      <Show when={props.childrenCount > 1}>
        <Show when={props.nodeIndex > 0}>
          <MoveNodeUpMenuItem nodeId={props.feedId} />
        </Show>
        <Show when={props.nodeIndex < props.childrenCount - 1}>
          <MoveNodeDownMenuItem nodeId={props.feedId} />
        </Show>
        <Separator />
      </Show>
      <DeleteFeedMenuItem
        feedId={props.feedId}
        feedName={props.feedName}
        deletionTrigger="folderChild"
      />
    </>
  );
}

interface FeedActionsProps {
  feedId: number;
  feedName: string;
  nodeIndex: number;
  childrenCount: number;
}
