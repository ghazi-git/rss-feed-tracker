import { Setter } from "solid-js";

import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError, notifySuccess } from "@/popup/utils/notifications";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { setAndEnableTheme } from "@/popup/utils/ui-theme";
import { glogger } from "@/utils/logging";

import styles from "./RestoreButton.module.css";

export default function RestoreButton(props: RestoreButtonProps) {
  const { setPreferences } = usePreferencesContext();
  const { mutation, sendMsg } = createMutation("full-data/restore-trigger");

  return (
    <div class={styles.restore}>
      <ManageDataButton
        loading={mutation.isLoading}
        onClick={
          // eslint-disable-next-line solid/reactivity
          async () => {
            try {
              const [fileHandle] = await window.showOpenFilePicker({
                id: "data-restore",
                types: [{ accept: { "application/zip": [".zip"] } }],
              });
              const file = await fileHandle.getFile();
              const fileURL = URL.createObjectURL(file);
              await sendMsg({ fileURL });
              if (mutation.isSuccess) {
                props.setIndexRebuildingDisabled(true);
                notifySuccess("Backup restored successfully.");
                const { uiTheme, ...prefs } = mutation.data;
                setAndEnableTheme(uiTheme);
                await setPreferences(prefs);
              } else if (mutation.isError) {
                notifyError(mutation.errorMsg);
              }
            } catch (e) {
              if (e instanceof DOMException && e.name === "AbortError") {
                // user didn't choose a file, do nothing
              } else {
                glogger.error("data restore failure", e);
              }
            }
          }
        }
      >
        Full Data Restore...
      </ManageDataButton>
      <p>
        <span class={styles.warning}>Deletes existing data</span> before
        restoring all extension data from the provided backup.
      </p>
    </div>
  );
}

interface RestoreButtonProps {
  setIndexRebuildingDisabled: Setter<boolean>;
}
