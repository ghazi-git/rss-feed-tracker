import { Show } from "solid-js";

import { useDropdownContext } from "@/popup/components/dropdown/context";
import MenuItem from "@/popup/components/dropdown/MenuItem";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";
import { useReloadFeedsContext } from "@/popup/pages/node-posts/reload-feeds-context";

import styles from "./ReloadNodeMenuItem.module.css";

export default function ReloadNodeMenuItem(props: { nodeId: number }) {
  const { mutation, reloadFeeds } = useReloadFeedsContext();
  const { closeMenu, focusTrigger } = useDropdownContext();

  return (
    <MenuItem
      class={mutation.isLoading ? styles.loading : ""}
      onClick={() => {
        if (!mutation.isLoading) {
          reloadFeeds(props.nodeId).then(() => {
            closeMenu();
            focusTrigger();
          });
        }
      }}
    >
      <Show when={mutation.isLoading} fallback="Reload">
        Reloading <LoadingIcon />
      </Show>
    </MenuItem>
  );
}
