import {
  getRootFolderUnreadCount,
  setUnreadCountOnExtensionBadge,
} from "@/background/utils/badge-unread-count";
import { getDBConnection } from "@/db-setup";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await setBadgeColors();
  if (reason !== "install") {
    using conn = await getDBConnection();
    const tx = conn.db.transaction(["nodes"]);
    const unreadCount = await getRootFolderUnreadCount(tx);
    if (unreadCount) {
      setUnreadCountOnExtensionBadge(unreadCount);
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await setBadgeColors();

  using conn = await getDBConnection();
  const tx = conn.db.transaction(["nodes"]);
  const unreadCount = await getRootFolderUnreadCount(tx);
  if (unreadCount) {
    setUnreadCountOnExtensionBadge(unreadCount);
  }
});

async function setBadgeColors() {
  await chrome.action.setBadgeBackgroundColor({ color: "#c9901e" });
  await chrome.action.setBadgeTextColor({ color: "#ffffff" });
}
