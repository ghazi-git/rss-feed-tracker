import { useNavigate } from "@solidjs/router";
import { showToast } from "solid-notifications";

import MenuItem from "@/popup/components/dropdown/MenuItem.jsx";
import Separator from "@/popup/components/dropdown/Separator.jsx";

import styles from "./FeedActions.module.css";

export default function FeedActions() {
  const navigate = useNavigate();
  return (
    <>
      <MenuItem onClick={() => navigate("/add-feed")}>Edit</MenuItem>
      <MenuItem onClick={() => showToast("Reloading Feed...")}>Reload</MenuItem>
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
