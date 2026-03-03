import { createSignal, onMount } from "solid-js";

import { useBodyContext } from "@/popup/components/Body";
import Checkbox from "@/popup/components/forms/Checkbox";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import BackupButton from "@/popup/pages/preferences/BackupButton";
import ExportFeedsButton from "@/popup/pages/preferences/ExportFeedsButton";
import ExtensionVersion from "@/popup/pages/preferences/ExtensionVersion";
import IconsCacheButton from "@/popup/pages/preferences/IconsCacheButton";
import ImportFeedsButton from "@/popup/pages/preferences/ImportFeedsButton";
import OrderPostsBySetting from "@/popup/pages/preferences/OrderPostsBySetting";
import ResetSettingsButton from "@/popup/pages/preferences/ResetSettingsButton";
import RestoreButton from "@/popup/pages/preferences/RestoreButton";
import SearchIndexButton from "@/popup/pages/preferences/SearchIndexButton";
import { ThemeSwitcher } from "@/popup/pages/preferences/ThemeSwitcher";
import {
  useCurrentURL,
  useInitialState,
} from "@/popup/utils/last-visited-page";
import { usePreferencesContext } from "@/popup/utils/preferences-context";

import styles from "./index.module.css";

export default function Preferences() {
  const [indexRebuildingDisabled, setIndexRebuildingDisabled] =
    createSignal(false);
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
            e.target.value === "fetchedAt" ? "fetchedAt" : "publishedAt";
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
        for each page of posts."
        checked={preferences.groupFolderPosts}
        onChange={(event) => {
          setPreferences({ groupFolderPosts: event.target.checked });
        }}
      />
      <fieldset class={styles["manage-data"]}>
        <legend>Manage Extension Data</legend>
        <IconsCacheButton />
        <ResetSettingsButton />
        <SearchIndexButton
          class={styles.search}
          disabled={indexRebuildingDisabled()}
          setDisabled={setIndexRebuildingDisabled}
        />
        <ExportFeedsButton />
        <ImportFeedsButton />
        <BackupButton />
        <RestoreButton
          setIndexRebuildingDisabled={setIndexRebuildingDisabled}
        />
      </fieldset>
      <ExtensionVersion />
    </>
  );
}
