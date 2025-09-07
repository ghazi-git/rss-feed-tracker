import { useLocation, useNavigate } from "@solidjs/router";
import { Show } from "solid-js";
import { showToast } from "solid-notifications";

import MenuItem from "@/popup/components/dropdown/MenuItem.jsx";
import Separator from "@/popup/components/dropdown/Separator.jsx";
import { getSearchString } from "@/popup/utils/urls.js";

import styles from "./FolderActions.module.css";

export default function FolderActions(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const editUrl = () => {
    const currentUrl = `${location.pathname}${location.search}`;
    const searchString = getSearchString({ previousUrl: currentUrl });
    return `/folders/${props.nodeId}?${searchString}`;
  };

  return (
    <>
      <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>
      <MenuItem onClick={() => showToast("Reloading Feeds...")}>
        Reload
      </MenuItem>
      <Separator />
      <MenuItem onClick={() => navigate("/add-feed")}>Add Feed</MenuItem>
      <MenuItem onClick={() => navigate("/add-folder")}>Add Folder</MenuItem>
      <Separator />
      <MenuItem onClick={() => navigate("/import-feeds")}>
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
          onClick={() => showToast("show 'are you sure dialog'")}
        >
          Delete
        </MenuItem>
      </Show>
    </>
  );
}
