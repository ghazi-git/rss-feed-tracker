import Checkbox from "@/popup/components/forms/Checkbox";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import ClearCache from "@/popup/pages/preferences/ClearCache";
import { ThemeSwitcher } from "@/popup/pages/preferences/ThemeSwitcher";
import { usePreferencesContext } from "@/popup/utils/preferences-storage";

export default function Preferences() {
  const {
    store,
    setDefaultFeedUpdateFrequency,
    setMarkNewPostsUnread,
    setClickPostToToggleUnread,
  } = usePreferencesContext();

  return (
    <>
      <ThemeSwitcher />
      <FrequencyField
        label="Default Update Frequency For Feeds"
        value={store.defaultFeedUpdateFrequency}
        onChange={(e) => {
          setDefaultFeedUpdateFrequency(parseInt(e.target.value));
        }}
      />
      <Checkbox
        name="trackUnread"
        label="Mark new posts as unread"
        checked={store.markNewPostsUnread}
        onChange={(event) => {
          setMarkNewPostsUnread(event.target.checked);
        }}
      />
      <Checkbox
        name="clickPostToToggleUnread"
        label="Post click toggles unread"
        helpText="When unchecked, clicking on a post will open it in a new tab"
        checked={store.clickPostToToggleUnread}
        onChange={(event) => {
          setClickPostToToggleUnread(event.target.checked);
        }}
      />
      <ClearCache />
    </>
  );
}
