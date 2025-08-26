import { useLocation } from "@solidjs/router";
import { createSignal } from "solid-js";

import Anchor from "@/popup/components/Anchor.jsx";

import styles from "./Header.module.css";

export default function Header() {
  const [activeTab, setActiveTab] = createSignal(getCurrentTab());

  return (
    <header class={styles.header}>
      <Anchor
        href="/"
        class={styles.tab}
        classList={{ [styles.active]: activeTab() === "feeds" }}
        onClick={() => setActiveTab("feeds")}
      >
        Feeds
      </Anchor>
      <Anchor
        href="/bookmarks"
        class={`${styles.tab} ${styles.bookmarks}`}
        classList={{ [styles.active]: activeTab() === "bookmarks" }}
        onClick={() => setActiveTab("bookmarks")}
      >
        Bookmarks
      </Anchor>
      <Anchor
        href="/settings"
        class={styles.tab}
        classList={{ [styles.active]: activeTab() === "settings" }}
        onClick={() => setActiveTab("settings")}
      >
        Settings
      </Anchor>
    </header>
  );
}

function getCurrentTab() {
  const location = useLocation();
  const url = location.pathname;
  if (url.startsWith("/bookmarks")) {
    return "bookmarks";
  } else if (url.startsWith("/settings")) {
    return "settings";
  } else {
    return "feeds";
  }
}
