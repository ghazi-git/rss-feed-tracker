import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import { showToast } from "solid-notifications";

import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context.jsx";
import MenuItem from "@/popup/components/dropdown/MenuItem.jsx";
import Separator from "@/popup/components/dropdown/Separator.jsx";
import { getSearchString } from "@/popup/utils/urls.js";

import styles from "./FolderActions.module.css";

export default function FolderActions(props) {
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
    return `/add-folder?parentFolderId=${props.folderId}&${prevUrlSearchString()}`;
  });
  const importFeedsUrl = createMemo(() => {
    return `/import-feeds?parentFolderId=${props.folderId}&${prevUrlSearchString()}`;
  });

  return (
    <>
      <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>
      <MenuItem onClick={() => showToast("Reloading Feeds...")}>
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
        onClick={() => showToast("Exporting Feeds under this folder...")}
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
