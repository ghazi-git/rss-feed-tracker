import "./feeds/messaging";

import { setupDB } from "@/background/db-setup";

chrome.runtime.onInstalled.addListener(async () => {
  // eslint-disable-next-line -- create db
  using connection = await setupDB();
});
