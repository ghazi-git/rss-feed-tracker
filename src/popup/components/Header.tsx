import { useLocation, useNavigate } from "@solidjs/router";
import { createEffect, createSignal } from "solid-js";

import Anchor from "@/popup/components/Anchor";
import { createShortcut } from "@/popup/utils/shortcuts";

import styles from "./Header.module.css";

export default function Header() {
  const location = useLocation();
  const [activeTab, setActiveTab] = createSignal<Tab>("library");

  createEffect(() => {
    const tab = getCurrentTab(location.pathname);
    setActiveTab(tab);
  });

  const navigate = useNavigate();
  createShortcut("ctrl+l", () => navigate('/library?focusedIndex=0"'));
  createShortcut("ctrl+b", () => navigate("/bookmarks?focusedIndex=0"));
  createShortcut("ctrl+p", () => navigate("/preferences"));

  return (
    <header class={styles.header}>
      <Anchor
        href="/library"
        class={styles.tab}
        classList={{ [styles.active]: activeTab() === "library" }}
      >
        Library
      </Anchor>
      <Anchor
        href="/bookmarks"
        class={`${styles.tab} ${styles.bookmarks}`}
        classList={{ [styles.active]: activeTab() === "bookmarks" }}
      >
        Bookmarks
      </Anchor>
      <Anchor
        href="/preferences"
        class={styles.tab}
        classList={{ [styles.active]: activeTab() === "preferences" }}
      >
        Preferences
      </Anchor>
    </header>
  );
}

function getCurrentTab(url: string): Tab {
  if (url.startsWith("/bookmarks")) {
    return "bookmarks";
  } else if (url.startsWith("/preferences")) {
    return "preferences";
  } else {
    return "library";
  }
}

type Tab = "library" | "bookmarks" | "preferences";
