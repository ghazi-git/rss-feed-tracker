import { useLocation, useNavigate } from "@solidjs/router";
import { Show } from "solid-js";

import { useDeleteNodeContext } from "@/popup/components/delete-node-dialog/context";
import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import Separator from "@/popup/components/dropdown/Separator";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";
import { useReloadFeedsContext } from "@/popup/pages/node-posts/reload-feeds-context";
import { getSearchString } from "@/popup/utils/urls";

import styles from "./FeedActions.module.css";

export default function FeedActions(props: FeedActionsProps) {
  const { mutation, reloadFeeds } = useReloadFeedsContext();
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
        class={mutation.isLoading ? styles.reloading : ""}
        onClick={async () => {
          if (!mutation.isLoading) {
            await reloadFeeds(props.feedId);
            closeMenu();
          }
        }}
      >
        <Show when={mutation.isLoading} fallback="Reload">
          Reloading <LoadingIcon />
        </Show>
      </MenuItem>
      <Separator />
      <MenuItem
        class={styles.delete}
        onClick={(event) => {
          event.preventDefault();
          const text = `Are you sure you want to delete the feed '${props.feedName}'?`;
          openModal(props.feedId, "feed", text, props.deletionTrigger);
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
  deletionTrigger: "folderChild" | "nodeHeader";
}
