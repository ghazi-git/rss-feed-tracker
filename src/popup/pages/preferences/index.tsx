import { onMount } from "solid-js";

import { useBodyContext } from "@/popup/components/Body";
import Checkbox from "@/popup/components/forms/Checkbox";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import ExtensionVersion from "@/popup/pages/preferences/ExtensionVersion";
import ManageExtensionData from "@/popup/pages/preferences/ManageExtensionData";
import OrderPostsBySetting from "@/popup/pages/preferences/OrderPostsBySetting";
import { ThemeSwitcher } from "@/popup/pages/preferences/ThemeSwitcher";
import {
  useCurrentURL,
  useInitialState,
} from "@/popup/utils/last-visited-page";
import { usePreferencesContext } from "@/popup/utils/preferences-context";

import styles from "./index.module.css";

export default function Preferences() {
  const { preferences, setPreferences } = usePreferencesContext();
  const initialState = useInitialState();
  const currentURL = useCurrentURL();
  const { setScrollPosition } = useBodyContext();
  onMount(() => {
    if (initialState?.url === currentURL()) {
      setScrollPosition(initialState.scrollPosition);
    }
  });

  return (
    <>
      <div class={styles.margin}>
        <ThemeSwitcher />
      </div>
      <FrequencyField
        label="Default Update Frequency For Feeds"
        value={preferences.defaultFeedUpdateFrequency}
        onChange={(e) => {
          const val = e.target.value;
          setPreferences({
            defaultFeedUpdateFrequency: val ? parseInt(val) : null,
          });
        }}
      />
      <OrderPostsBySetting
        value={preferences.orderPostsBy}
        onChange={(e) => {
          const val =
            e.target.value === "receivedAt" ? "receivedAt" : "publishedAt";
          setPreferences({ orderPostsBy: val });
        }}
      />
      <Checkbox
        name="clickPostToToggleUnread"
        label="Post click toggles unread"
        helpText="When unchecked, clicking on a post will open it in a new tab"
        checked={preferences.clickPostToToggleUnread}
        onChange={(event) => {
          setPreferences({ clickPostToToggleUnread: event.target.checked });
        }}
      />
      <Checkbox
        name="groupFolderPosts"
        label="Group folder posts by feed"
        helpText="When displaying posts inside a folder, posts for feed X will
        be shown first, then posts for feed Y, ... This grouping will be done
        for each page pf posts."
        checked={preferences.groupFolderPosts}
        onChange={(event) => {
          setPreferences({ groupFolderPosts: event.target.checked });
        }}
      />
      <ManageExtensionData />
      <ExtensionVersion />
    </>
  );
}
