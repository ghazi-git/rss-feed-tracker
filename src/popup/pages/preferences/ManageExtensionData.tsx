import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";

import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { createMutation } from "@/popup/utils/mutation";
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from "@/popup/utils/notifications";
import { usePreferencesContext } from "@/popup/utils/preferences-context";
import { setAndEnableTheme, uiTheme } from "@/popup/utils/ui-theme";
import { getSearchString } from "@/popup/utils/urls";
import { DEFAULT_PREFERENCES } from "@/utils/extension-storage";
import { glogger } from "@/utils/logging";
import { ICONS_CACHE } from "@/utils/settings";

import styles from "./ManageExtensionData.module.css";

export default function ManageExtensionData() {
  const { preferences, setPreferences } = usePreferencesContext();
  const navigate = useNavigate();
  const location = useLocation();
  const prevUrlSearchString = () => {
    const currentUrl = `${location.pathname}${location.search}`;
    return getSearchString({ previousUrl: currentUrl });
  };

  const [clearingCache, setClearingCache] = createSignal(false);
  const { mutation: exportMutation, sendMsg: exportOPML } = createMutation(
    "opml/trigger-root-export",
  );
  const { mutation: backupMutation, sendMsg: backupData } = createMutation(
    "full-data/backup-trigger",
  );
  const { mutation: restoreMutation, sendMsg: restoreData } = createMutation(
    "full-data/restore-trigger",
  );
  const { mutation: searchMutation, sendMsg: rebuildIndex } = createMutation(
    "search-index/trigger-rebuild",
  );

  return (
    <fieldset class={styles["manage-data"]}>
      <legend>Manage Extension Data</legend>
      <ManageDataButton
        loading={clearingCache()}
        onClick={async () => {
          setClearingCache(true);
          const deleted = await caches.delete(ICONS_CACHE);
          setClearingCache(false);
          if (deleted) {
            notifySuccess("The cache was cleared.", { duration: 3000 });
          } else {
            notifyInfo("The cache has already been cleared.", {
              duration: 3000,
            });
          }
        }}
      >
        Clear Feed Icons Cache
      </ManageDataButton>
      <ManageDataButton
        onClick={async () => {
          // reset UI theme to system theme
          setAndEnableTheme(null);
          // reset preferences
          await setPreferences(DEFAULT_PREFERENCES);
        }}
      >
        Reset Settings
      </ManageDataButton>
      <ManageDataButton
        class={styles.search}
        loading={searchMutation.isLoading}
        onClick={async () => {
          await rebuildIndex(undefined);
          if (searchMutation.isError) {
            notifyError(searchMutation.errorMsg);
          }
        }}
      >
        Rebuild Search Index
      </ManageDataButton>
      <ManageDataButton
        loading={exportMutation.isLoading}
        onClick={async () => {
          await exportOPML(undefined);
          if (exportMutation.isError) {
            notifyError(exportMutation.errorMsg);
          }
        }}
      >
        Export Feeds
      </ManageDataButton>
      <ManageDataButton
        onClick={async () => {
          navigate(`/library/feeds/import?${prevUrlSearchString()}`);
        }}
      >
        Import Feeds
      </ManageDataButton>

      <ManageDataButton
        loading={backupMutation.isLoading}
        onClick={async () => {
          await backupData({ uiTheme: uiTheme(), ...preferences });
          if (backupMutation.isError) {
            notifyError(backupMutation.errorMsg);
          }
        }}
      >
        Full Data Backup
      </ManageDataButton>
      <ManageDataButton
        loading={restoreMutation.isLoading}
        onClick={async () => {
          try {
            const [fileHandle] = await window.showOpenFilePicker({
              id: "data-restore",
              types: [{ accept: { "application/zip": [".zip"] } }],
            });
            const file = await fileHandle.getFile();
            const fileURL = URL.createObjectURL(file);
            await restoreData({ fileURL });
            if (restoreMutation.isSuccess) {
              notifySuccess("Backup restored successfully.");
              const { uiTheme, ...prefs } = restoreMutation.data;
              setAndEnableTheme(uiTheme);
              await setPreferences(prefs);
            } else if (restoreMutation.isError) {
              notifyError(restoreMutation.errorMsg);
            }
          } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
              // user didn't choose a file, do nothing
            } else {
              glogger.error("data restore failure", e);
            }
          }
        }}
      >
        Full Data Restore...
      </ManageDataButton>
      <p>
        Backs up everything (folders, feeds, posts, bookmarks and settings) as a
        zip file.
      </p>
      <p>
        <span class={styles.warning}>Clears existing data</span> before
        restoring all extension data from the provided backup.
      </p>
    </fieldset>
  );
}
