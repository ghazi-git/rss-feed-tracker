import { useLocation, useNavigate } from "@solidjs/router";
import { showToast } from "solid-notifications";

import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import MenuItem from "@/popup/components/dropdown/MenuItem.jsx";
import Separator from "@/popup/components/dropdown/Separator.jsx";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./FeedActions.module.css";

export default function FeedActions(props) {
  const { openModal } = useDeleteNodeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const editUrl = () => {
    const currentUrl = `${location.pathname}${location.search}`;
    const searchString = getSearchString({ previousUrl: currentUrl });
    return `/library/feeds/${props.feedId}/edit?${searchString}`;
  };

  return (
    <>
      <MenuItem onClick={() => navigate(editUrl())}>Edit</MenuItem>
      <MenuItem onClick={() => showToast("Reloading Feed...")}>Reload</MenuItem>
      <Separator />
      <MenuItem
        class={styles.delete}
        onClick={() => {
          const text = `Are you sure you want to delete the feed '${props.feedName}'?`;
          openModal(props.feedId, "Delete Feed", text);
        }}
      >
        Delete
      </MenuItem>
    </>
  );
}
