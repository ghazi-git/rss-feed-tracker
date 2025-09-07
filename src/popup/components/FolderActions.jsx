import { useNavigate } from "@solidjs/router";
import { showToast } from "solid-notifications";

import MenuItem from "@/popup/components/dropdown/MenuItem.jsx";
import Separator from "@/popup/components/dropdown/Separator.jsx";

import styles from "./FolderActions.module.css";

export default function FolderActions() {
  const navigate = useNavigate();
  return (
    <>
      <MenuItem onClick={() => navigate("/add-folder")}>Edit</MenuItem>
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
      <Separator />
      <MenuItem
        class={styles.delete}
        onClick={() => showToast("show 'are you sure dialog'")}
      >
        Delete
      </MenuItem>
    </>
  );
}
