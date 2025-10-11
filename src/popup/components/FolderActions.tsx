import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo, Show } from "solid-js";

import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import Separator from "@/popup/components/dropdown/Separator";
import { notifyInfo } from "@/popup/utils/notifications";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./FolderActions.module.css";

export default function FolderActions(props: FolderActionsProps) {
  const { openModal } = useDeleteNodeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const prevUrlSearchString = createMemo(() => {
    const currentUrl = `${location.pathname}${location.search}`;
    return getSearchString({ previousUrl: currentUrl });
  });
  const editUrl = createMemo(
    () => `/library/folders/${props.folderId}/edit?${prevUrlSearchString()}`,
  );
  const addFeedUrl = createMemo(() => {
    return `/library/feeds/add?parentFolderId=${props.folderId}&${prevUrlSearchString()}`;
  });
  const addFolderUrl = createMemo(() => {
    return `/library/folders/add?parentFolderId=${props.folderId}&${prevUrlSearchString()}`;
  });
  const importFeedsUrl = createMemo(() => {
    return `/library/feeds/import?parentFolderId=${props.folderId}&${prevUrlSearchString()}`;
  });

  return (
    <>
      <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>
      <MenuItem onClick={() => notifyInfo("Reloading Feeds...")}>
        Reload
      </MenuItem>
      <Separator />
      <MenuItem onClick={() => navigate(addFeedUrl())}>Add Feed</MenuItem>
      <MenuItem onClick={() => navigate(addFolderUrl())}>Add Folder</MenuItem>
      <Separator />
      <MenuItem onClick={() => navigate(importFeedsUrl())}>
        Import Feeds
      </MenuItem>
      <MenuItem
        onClick={() => notifyInfo("Exporting Feeds under this folder...")}
      >
        Export Feeds
      </MenuItem>
      <Show when={!props.isRoot}>
        <Separator />
        <MenuItem
          class={styles.delete}
          onClick={() => {
            const text = `Are you sure you want to delete the folder '${props.folderName}' and all its contents?`;
            openModal(props.folderId, "Delete Folder", text);
          }}
        >
          Delete
        </MenuItem>
      </Show>
    </>
  );
}

interface FolderActionsProps {
  isRoot?: boolean;
  folderId: number;
  folderName: string;
}
