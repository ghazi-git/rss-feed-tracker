import { setupDB } from "@/background/db-setup";

chrome.runtime.onInstalled.addListener(async () => {
  // apply schema changes
  await setupDB();
});
