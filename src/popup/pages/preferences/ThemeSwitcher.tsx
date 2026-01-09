import RadioGroup from "@/popup/components/forms/RadioGroup";
import {
  detectSystemTheme,
  enableTheme,
  storeTheme,
  uiTheme,
} from "@/popup/utils/ui-theme";

export function ThemeSwitcher() {
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
