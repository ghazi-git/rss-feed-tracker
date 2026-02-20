import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";

import styles from "./DeleteNodeMenuItem.module.css";

export default function DeleteFeedMenuItem(props: DeleteFeedProps) {
  const { openModal } = useDeleteNodeContext();

  return (
    <MenuItem
      class={styles.delete}
      onClick={(event) => {
        event.preventDefault();
        const text = `Are you sure you want to delete the feed '${props.feedName}'?`;
        openModal(
          props.feedId,
          "feed",
          text,
          props.deletionTrigger,
          props.parentFolderId ?? null,
        );
      }}
    >
      Delete
    </MenuItem>
  );
}

interface DeleteFeedProps {
  feedId: number;
  feedName: string;
  parentFolderId?: number | null;
  deletionTrigger: "folderChild" | "nodeHeader";
}
