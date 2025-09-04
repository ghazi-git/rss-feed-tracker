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
        classList={{ [styles.active]: activeTab() === "library" }}
        onClick={() => setActiveTab("library")}
      >
        Library
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
        href="/preferences"
        class={styles.tab}
        classList={{ [styles.active]: activeTab() === "preferences" }}
        onClick={() => setActiveTab("preferences")}
      >
        Preferences
      </Anchor>
    </header>
  );
}

function getCurrentTab() {
  const location = useLocation();
  const url = location.pathname;
  if (url.startsWith("/bookmarks")) {
    return "bookmarks";
  } else if (url.startsWith("/preferences")) {
    return "preferences";
  } else {
    return "library";
  }
}
