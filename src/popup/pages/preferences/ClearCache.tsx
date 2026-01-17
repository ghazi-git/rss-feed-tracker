import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";

import { DEFAULT_PREFERENCES } from "@/extension-storage";
import ManageDataButton from "@/popup/pages/preferences/ManageDataButton";
import { createMutation } from "@/popup/utils/mutation";
import { notifyInfo, notifySuccess } from "@/popup/utils/notifications";
import { usePreferencesContext } from "@/popup/utils/preferences-storage";
import { setAndEnableTheme } from "@/popup/utils/ui-theme";
import { getSearchString } from "@/popup/utils/urls";
import { ICONS_CACHE } from "@/settings";

import styles from "./ClearCache.module.css";

export default function ClearCache() {
  const { setPreferences } = usePreferencesContext();
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
          setAndEnableTheme("");
          // reset preferences
          await setPreferences(DEFAULT_PREFERENCES);
        }}
      >
        Reset Settings
      </ManageDataButton>

      <ManageDataButton
        loading={exportMutation.isLoading}
        onClick={async () => {
          await exportOPML(undefined);
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

      <ManageDataButton>Full Data Backup</ManageDataButton>
      <ManageDataButton
        onClick={async () => {
          const accept: Record<MIMEType, FileExtension[]> = {
            "text/xml": [".opml"],
            "application/xml": [".opml"],
            "text/x-opml": [".opml"],
            "text/x-opml+xml": [".opml"],
          };
          let fileHandle: FileSystemFileHandle;
          try {
            [fileHandle] = await window.showOpenFilePicker({
              id: "data-restore",
              types: [{ accept }],
            });
            const file = await fileHandle.getFile();
            const fileURL = URL.createObjectURL(file);
            console.log("URL.createObjectURL(file)", fileURL);
          } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") {
              // user didn't choose a file, do nothing
            } else {
              console.error(e);
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
