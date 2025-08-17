import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";

import styles from "./Header.module.css";

export default function Header() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = createSignal(getCurrentTab());

  return (
    <header class={styles.header}>
      <div
        class={styles.tab}
        classList={{ [styles.active]: activeTab() === "feeds" }}
        onClick={() => {
          setActiveTab("feeds");
          navigate("/");
        }}
      >
        Feeds
      </div>
      <div
        class={`${styles.tab} ${styles.bookmarks}`}
        classList={{ [styles.active]: activeTab() === "bookmarks" }}
        onClick={() => {
          setActiveTab("bookmarks");
          navigate("/bookmarks");
        }}
      >
        Bookmarks
      </div>
      <div
        class={styles.tab}
        classList={{ [styles.active]: activeTab() === "settings" }}
        onClick={() => {
          setActiveTab("settings");
          navigate("/settings");
        }}
      >
        Settings
      </div>
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
