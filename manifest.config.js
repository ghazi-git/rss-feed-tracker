import { defineManifest } from "@crxjs/vite-plugin";

import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  // require v141 to be able to use getAll with descending order
  minimum_chrome_version: "141",
  icons: {
    48: "public/rss-feed-tracker-logo-48x48.png",
    96: "public/rss-feed-tracker-logo-96x96.png",
    128: "public/rss-feed-tracker-logo-128x128.png",
  },
  action: {
    default_icon: "public/rss-feed-tracker-logo-48x48.png",
    default_popup: "src/popup/index.html",
    default_title: "RSS Feed Tracker",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  permissions: ["storage", "alarms", "offscreen"],
  host_permissions: ["http://*/*", "https://*/*"],
});
