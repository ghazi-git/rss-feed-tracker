import Checkbox from "@/popup/components/forms/Checkbox";
import RadioGroup from "@/popup/components/forms/RadioGroup";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import { usePreferencesContext } from "@/popup/utils/preferences-storage";
import {
  detectSystemTheme,
  enableTheme,
  storeTheme,
  uiTheme,
} from "@/popup/utils/ui-theme";

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
    </>
  );
}

function ThemeSwitcher() {
  const themes = [
    { label: "System", value: "" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  return (
    <RadioGroup
      name="theme"
      label="Theme Switcher"
      options={themes}
      value={uiTheme() ?? ""}
      onChange={(e) => {
        const newTheme = e.target.value;
        storeTheme(newTheme);
        const theme = newTheme || detectSystemTheme();
        enableTheme(theme);
      }}
    />
  );
}
