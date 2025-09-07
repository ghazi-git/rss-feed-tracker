import { useLocation, useNavigate } from "@solidjs/router";
import { showToast } from "solid-notifications";

import MenuItem from "@/popup/components/dropdown/MenuItem.jsx";
import Separator from "@/popup/components/dropdown/Separator.jsx";
import { getSearchString } from "@/popup/utils/urls.js";

import styles from "./FeedActions.module.css";

export default function FeedActions(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const editUrl = () => {
    const currentUrl = `${location.pathname}${location.search}`;
    const searchString = getSearchString({ previousUrl: currentUrl });
    return `/feeds/${props.feedId}?${searchString}`;
  };

  return (
    <>
      <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>
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
