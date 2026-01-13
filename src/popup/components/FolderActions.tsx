import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo, Show } from "solid-js";

import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import Separator from "@/popup/components/dropdown/Separator";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";
import { useReloadFeedsContext } from "@/popup/pages/node-posts/reload-feeds-context";
import { notifyInfo } from "@/popup/utils/notifications";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./FolderActions.module.css";

export default function FolderActions(props: FolderActionsProps) {
  const { mutation, reloadFeeds } = useReloadFeedsContext();
  const { closeMenu } = useDropdownContext();
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
      <MenuItem
        class={mutation.isLoading ? styles.reloading : ""}
        onClick={async () => {
          if (!mutation.isLoading) {
            await reloadFeeds(props.folderId);
            closeMenu();
          }
        }}
      >
        <Show when={mutation.isLoading} fallback="Reload">
          Reloading <LoadingIcon />
        </Show>
      </MenuItem>
      <Separator />
      <MenuItem onClick={() => navigate(addFeedUrl())}>Add Feed</MenuItem>
      <MenuItem onClick={() => navigate(addFolderUrl())}>Add Folder</MenuItem>
      <Separator />
      <MenuItem onClick={() => navigate(importFeedsUrl())}>
        Import Feeds
      </MenuItem>
      <MenuItem
        onClick={() => {
          notifyInfo("Exporting Feeds under this folder...");
          closeMenu();
        }}
      >
        Export Feeds
      </MenuItem>
      <Show when={!props.isRoot}>
        <Separator />
        <MenuItem
          class={styles.delete}
          onClick={(event) => {
            event.preventDefault();
            const text = `Are you sure you want to delete the folder '${props.folderName}' and all its contents?`;
            openModal(props.folderId, "folder", text, props.deletionTrigger);
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
  deletionTrigger: "folderChild" | "nodeHeader";
}
