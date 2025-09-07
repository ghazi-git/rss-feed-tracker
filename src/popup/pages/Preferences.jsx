import { createSignal } from "solid-js";
import { showToast } from "solid-notifications";

import Checkbox from "@/popup/components/forms/Checkbox.jsx";
import RadioGroup from "@/popup/components/forms/RadioGroup.jsx";
import DownloadIcon from "@/popup/components/svg-icons/DownloadIcon.jsx";
import UploadIcon from "@/popup/components/svg-icons/UploadIcon.jsx";
import ActionCard from "@/popup/pages/no-feeds-yet/ActionCard.jsx";
import { getSearchString } from "@/popup/utils/urls.js";

import styles from "./Preferences.module.css";

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
  const previousUrl = getSearchString({ previousUrl: "/preferences" });
  return (
    <>
      <div class={styles["import-export"]}>
        <ActionCard text="Import Feeds" href={`/import-feeds?${previousUrl}`}>
          <UploadIcon />
        </ActionCard>
        <ActionCard
          text="Export Feeds"
          href="#"
          onClick={() => showToast("Exporting feeds")}
        >
          <DownloadIcon />
        </ActionCard>
      </div>
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
