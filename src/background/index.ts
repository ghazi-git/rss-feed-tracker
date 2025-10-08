import "./feeds/messaging";

import { getDBConnection } from "@/background/db-setup";

chrome.runtime.onInstalled.addListener(async () => {
  // eslint-disable-next-line -- create db
  using connection = await getDBConnection();
});
