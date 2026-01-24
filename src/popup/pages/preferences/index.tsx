import Checkbox from "@/popup/components/forms/Checkbox";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import ManageExtensionData from "@/popup/pages/preferences/ManageExtensionData";
import { ThemeSwitcher } from "@/popup/pages/preferences/ThemeSwitcher";
import { usePreferencesContext } from "@/popup/utils/preferences-context";

import styles from "./index.module.css";

export default function Preferences() {
  const { preferences, setPreferences } = usePreferencesContext();

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
      <Checkbox
        name="trackUnread"
        label="Mark new posts as unread"
        checked={preferences.markNewPostsUnread}
        onChange={(event) => {
          setPreferences({ markNewPostsUnread: event.target.checked });
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
      <ManageExtensionData />
    </>
  );
}
