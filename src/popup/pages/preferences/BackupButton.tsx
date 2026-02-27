import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { createMutation } from "@/popup/utils/mutation";
import { notifyError } from "@/popup/utils/notifications";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { uiTheme } from "@/popup/utils/ui-theme";

import styles from "./BackupButton.module.css";

export default function BackupButton() {
  const { preferences } = usePreferencesContext();
  const { mutation, sendMsg } = createMutation("full-data/backup-trigger");

  return (
    <div class={styles.backup}>
      <ManageDataButton
        loading={mutation.isLoading}
        onClick={() => {
          sendMsg({ uiTheme: uiTheme(), ...preferences }).then(() => {
            if (mutation.isError) {
              notifyError(mutation.errorMsg);
            }
          });
        }}
      >
        Full Data Backup
      </ManageDataButton>
      <p>
        Backs up everything (folders, feeds, posts, bookmarks and settings) as a
        zip file.
      </p>
    </div>
  );
}
