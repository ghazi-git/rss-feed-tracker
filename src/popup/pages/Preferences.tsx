import { createSignal } from "solid-js";

import Checkbox from "@/popup/components/forms/Checkbox";
import RadioGroup from "@/popup/components/forms/RadioGroup";
import FrequencyField from "@/popup/pages/add-edit-feed/FrequencyField";
import {
  detectSystemTheme,
  enableTheme,
  storeTheme,
  uiTheme,
} from "@/popup/utils/ui-theme";

export default function Preferences() {
  const [unread, setUnread] = createSignal(true);
  const [frequency, setFrequency] = createSignal(2 * 60 * 60 * 1000);
  const themes = [
    { label: "System", value: "" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];
  return (
    <>
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
      <FrequencyField
        value={frequency()}
        onChange={(e) => setFrequency(parseInt(e.target.value))}
      />
      <Checkbox
        name="unread"
        label="Track Unread Items"
        checked={unread()}
        onChange={() => setUnread((prev) => !prev)}
      />
    </>
  );
}
