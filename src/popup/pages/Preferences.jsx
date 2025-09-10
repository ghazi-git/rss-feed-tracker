import { createSignal } from "solid-js";

import Checkbox from "@/popup/components/forms/Checkbox.jsx";
import RadioGroup from "@/popup/components/forms/RadioGroup.jsx";

export default function Preferences() {
  const [unread, setUnread] = createSignal(true);
  const [frequency, setFrequency] = createSignal("2h");
  const frequencies = [
    { label: "1 hour", value: "1h" },
    { label: "2 hours", value: "2h" },
    { label: "4 hours", value: "4h" },
    { label: "6 hours", value: "6h" },
    { label: "1 day", value: "1d" },
  ];
  return (
    <>
      <RadioGroup
        name="frequency"
        label="Update Frequency"
        options={frequencies}
        value={frequency()}
        onChange={(e) => setFrequency(e.target.value)}
      />
      <Checkbox
        name="unread"
        label="Track Unread Items"
        value={unread()}
        onChange={(e) => setUnread(e.target.value)}
      />
    </>
  );
}
