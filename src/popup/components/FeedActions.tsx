import { useLocation, useNavigate } from "@solidjs/router";

import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import Separator from "@/popup/components/dropdown/Separator";
import { notifyInfo } from "@/popup/utils/notifications";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./FeedActions.module.css";

export default function FeedActions(props: FeedActionsProps) {
  const { closeMenu } = useDropdownContext();
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
      <MenuItem
        onClick={() => {
          notifyInfo("Reloading Feed...");
          closeMenu();
        }}
      >
        Reload
      </MenuItem>
      <Separator />
      <MenuItem
        class={styles.delete}
        onClick={(event) => {
          event.preventDefault();
          const text = `Are you sure you want to delete the feed '${props.feedName}'?`;
          openModal(props.feedId, "Delete Feed", text);
        }}
      >
        Delete
      </MenuItem>
    </>
  );
}

interface FeedActionsProps {
  feedId: number;
  feedName: string;
}
