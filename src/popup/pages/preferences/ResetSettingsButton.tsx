import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { setAndEnableTheme } from "@/popup/utils/ui-theme";
import { DEFAULT_PREFERENCES } from "@/utils/extension-storage";

import ManageDataButton from "./ManageDataButton";

export default function ResetSettingsButton() {
  const { setPreferences } = usePreferencesContext();

  return (
    <ManageDataButton
      onClick={() => {
        // reset UI theme to system theme
        setAndEnableTheme(null);
        // reset preferences
        setPreferences(DEFAULT_PREFERENCES);
      }}
    >
      Reset Settings
    </ManageDataButton>
  );
}
