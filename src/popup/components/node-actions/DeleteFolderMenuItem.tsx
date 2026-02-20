import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";

import styles from "./DeleteNodeMenuItem.module.css";

export default function DeleteFolderMenuItem(props: DeleteFolderProps) {
  const { openModal } = useDeleteNodeContext();

  return (
    <MenuItem
      class={styles.delete}
      onClick={(event) => {
        event.preventDefault();
        const text = `Are you sure you want to delete the folder '${props.folderName}' and all its contents?`;
        openModal(
          props.folderId,
          "folder",
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

interface DeleteFolderProps {
  folderId: number;
  folderName: string;
  parentFolderId?: number | null;
  deletionTrigger: "folderChild" | "nodeHeader";
}
