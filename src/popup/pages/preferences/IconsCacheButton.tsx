import { createSignal } from "solid-js";

import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { notifyInfo, notifySuccess } from "@/popup/utils/notifications";
import { ICONS_CACHE } from "@/utils/settings";

export default function IconsCacheButton() {
  const [clearingCache, setClearingCache] = createSignal(false);

  return (
    <ManageDataButton
      loading={clearingCache()}
      onClick={
        // eslint-disable-next-line solid/reactivity
        async () => {
          setClearingCache(true);
          const deleted = await caches.delete(ICONS_CACHE);
          setClearingCache(false);
          if (deleted) {
            notifySuccess("The cache was cleared.");
          } else {
            notifyInfo("The cache has already been cleared.");
          }
        }
      }
    >
      Clear Feed Icons Cache
    </ManageDataButton>
  );
}
