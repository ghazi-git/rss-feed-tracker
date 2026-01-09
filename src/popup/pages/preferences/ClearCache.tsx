import { createSignal, Show } from "solid-js";

import { ICONS_CACHE } from "@/background/image-caching";
import UnstyledButton from "@/popup/components/buttons/UnstyledButton";
import LoadingIcon from "@/popup/components/svg-icons/LoadingIcon";
import { notifyInfo, notifySuccess } from "@/popup/utils/notifications";

import styles from "./ClearCache.module.css";

export default function ClearCache() {
  const [loading, setLoading] = createSignal(false);

  return (
    <UnstyledButton
      class={styles.clear}
      disabled={loading()}
      onClick={async () => {
        setLoading(true);
        const deleted = await caches.delete(ICONS_CACHE);
        setLoading(false);
        if (deleted) {
          notifySuccess("The cache was cleared.", { duration: 3000 });
        } else {
          notifyInfo("The cache has already been cleared.", { duration: 3000 });
        }
      }}
    >
      Clear Feed Icons Cache
      <Show when={loading()}>
        <LoadingIcon />
      </Show>
    </UnstyledButton>
  );
}
