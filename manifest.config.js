import { defineManifest } from "@crxjs/vite-plugin";

import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/rss-feed-tracker-logo-48x48.png",
    96: "public/rss-feed-tracker-logo-96x96.png",
    128: "public/rss-feed-tracker-logo-128x128.png",
  },
  action: {
    default_icon: "public/rss-feed-tracker-logo-48x48.png",
    default_popup: "src/popup/index.html",
  },
});
